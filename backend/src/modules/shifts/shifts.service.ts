import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ShiftAssignment, AssignmentStatus } from '../../entities/shift-assignment.entity';
import { ShiftAdjustmentLog, AdjustmentAction } from '../../entities/shift-adjustment-log.entity';
import { ShiftRequirement, ShiftType } from '../../entities/shift-requirement.entity';
import { Employee } from '../../entities/employee.entity';
import { LeaveRequest, LeaveStatus } from '../../entities/leave-request.entity';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { BatchUpdateShiftDto } from './dto/batch-update-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(ShiftAssignment)
    private shiftRepository: Repository<ShiftAssignment>,
    @InjectRepository(ShiftAdjustmentLog)
    private logRepository: Repository<ShiftAdjustmentLog>,
    @InjectRepository(ShiftRequirement)
    private requirementRepository: Repository<ShiftRequirement>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(LeaveRequest)
    private leaveRepository: Repository<LeaveRequest>,
  ) {}

  async create(dto: CreateShiftDto, operatorId: string): Promise<ShiftAssignment> {
    // 檢查是否已存在相同排班
    const existing = await this.shiftRepository.findOne({
      where: {
        date: new Date(dto.date),
        hospitalId: dto.hospitalId,
        shiftType: dto.shiftType,
        employeeId: dto.employeeId,
      },
    });
    if (existing) {
      throw new BadRequestException('該員工在此時段已有排班');
    }

    // 檢查員工是否請假
    const leave = await this.leaveRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        leaveDate: new Date(dto.date),
        status: LeaveStatus.APPROVED,
      },
    });
    if (leave && (!leave.shiftType || leave.shiftType === dto.shiftType)) {
      throw new BadRequestException('該員工在此時段已請假');
    }

    // 檢查衝突 (同一天已有其他班別)
    const conflicts = await this.checkConflicts(dto.employeeId, dto.date, dto.shiftType);
    if (conflicts.length > 0) {
      throw new BadRequestException(`排班衝突: ${conflicts.join(', ')}`);
    }

    const shift = this.shiftRepository.create({
      ...dto,
      date: new Date(dto.date),
      createdBy: operatorId,
    });

    const saved = await this.shiftRepository.save(shift);

    // 記錄調整日誌
    await this.logRepository.save({
      assignmentId: saved.id,
      action: AdjustmentAction.CREATE,
      newValue: dto,
      operatedBy: operatorId,
    });

    return saved;
  }

  async findAll(query: QueryShiftDto) {
    const { hospitalId, startDate, endDate, employeeId, shiftType } = query;

    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.employee', 'employee')
      .leftJoinAndSelect('shift.hospital', 'hospital')
      .where('shift.status != :cancelled', { cancelled: AssignmentStatus.CANCELLED });

    if (hospitalId) {
      queryBuilder.andWhere('shift.hospitalId = :hospitalId', { hospitalId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('shift.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (employeeId) {
      queryBuilder.andWhere('shift.employeeId = :employeeId', { employeeId });
    }

    if (shiftType) {
      queryBuilder.andWhere('shift.shiftType = :shiftType', { shiftType });
    }

    return queryBuilder
      .orderBy('shift.date', 'ASC')
      .addOrderBy('shift.shiftType', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<ShiftAssignment> {
    const shift = await this.shiftRepository.findOne({
      where: { id },
      relations: ['employee', 'hospital', 'adjustmentLogs'],
    });
    if (!shift) {
      throw new NotFoundException('排班記錄不存在');
    }
    return shift;
  }

  async update(id: string, dto: UpdateShiftDto, operatorId: string): Promise<ShiftAssignment> {
    const shift = await this.findOne(id);
    const oldValue = { ...shift };

    Object.assign(shift, dto);
    const updated = await this.shiftRepository.save(shift);

    // 記錄調整日誌
    await this.logRepository.save({
      assignmentId: id,
      action: AdjustmentAction.UPDATE,
      oldValue,
      newValue: dto,
      reason: dto.reason,
      operatedBy: operatorId,
    });

    return updated;
  }

  async remove(id: string, operatorId: string, reason?: string): Promise<void> {
    const shift = await this.findOne(id);

    // 軟刪除 - 更新狀態為取消
    shift.status = AssignmentStatus.CANCELLED;
    await this.shiftRepository.save(shift);

    // 記錄調整日誌
    await this.logRepository.save({
      assignmentId: id,
      action: AdjustmentAction.DELETE,
      oldValue: shift,
      reason,
      operatedBy: operatorId,
    });
  }

  async batchUpdate(dto: BatchUpdateShiftDto, operatorId: string) {
    const results = [];
    for (const item of dto.assignments) {
      try {
        if (item.action === 'create') {
          const created = await this.create(item as CreateShiftDto, operatorId);
          results.push({ success: true, data: created });
        } else if (item.action === 'delete' && item.id) {
          await this.remove(item.id, operatorId, dto.reason);
          results.push({ success: true, id: item.id });
        }
      } catch (error: any) {
        results.push({ success: false, error: error.message, item });
      }
    }
    return results;
  }

  // 取得某日期的班表摘要
  async getDailySummary(hospitalId: string, date: string) {
    const shifts = await this.shiftRepository.find({
      where: {
        hospitalId,
        date: new Date(date),
        status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
      },
      relations: ['employee'],
    });

    const requirements = await this.requirementRepository.find({
      where: { hospitalId },
      order: { effectiveDate: 'DESC' },
    });

    const summary: Record<string, any> = {};
    for (const type of Object.values(ShiftType)) {
      const typeShifts = shifts.filter((s) => s.shiftType === type);
      const requirement = requirements.find((r) => r.shiftType === type);

      summary[type] = {
        required: requirement?.requiredCount || 0,
        leaderRequired: requirement?.leaderRequired || 0,
        assigned: typeShifts.length,
        leaderAssigned: typeShifts.filter((s) => s.isLeaderDuty).length,
        employees: typeShifts.map((s) => ({
          id: s.employee.id,
          name: s.employee.name,
          isLeader: s.isLeaderDuty,
          isCrossHospital: s.isCrossHospital,
        })),
        hasGap: typeShifts.length < (requirement?.requiredCount || 0),
        hasLeaderGap:
          typeShifts.filter((s) => s.isLeaderDuty).length <
          (requirement?.leaderRequired || 0),
      };
    }

    return {
      date,
      hospitalId,
      summary,
    };
  }

  // 取得可用人員
  async getAvailableEmployees(hospitalId: string, date: string, shiftType: ShiftType) {
    // 取得該院區的員工
    const employees = await this.employeeRepository
      .createQueryBuilder('emp')
      .leftJoin('emp.hospitals', 'hospital')
      .where('hospital.id = :hospitalId', { hospitalId })
      .andWhere('emp.status = :status', { status: 'active' })
      .getMany();

    // 取得當天已排班的員工
    const assignedShifts = await this.shiftRepository.find({
      where: {
        date: new Date(date),
        status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
      },
    });

    // 取得當天請假的員工
    const leaves = await this.leaveRepository.find({
      where: {
        leaveDate: new Date(date),
        status: LeaveStatus.APPROVED,
      },
    });

    const assignedEmployeeIds = assignedShifts.map((s) => s.employeeId);
    const leaveEmployeeIds = leaves
      .filter((l) => !l.shiftType || l.shiftType === shiftType)
      .map((l) => l.employeeId);

    return employees.map((emp) => {
      const isAssigned = assignedEmployeeIds.includes(emp.id);
      const isOnLeave = leaveEmployeeIds.includes(emp.id);
      const assignedShift = assignedShifts.find((s) => s.employeeId === emp.id);

      return {
        ...emp,
        available: !isAssigned && !isOnLeave,
        reason: isOnLeave ? '請假' : isAssigned ? `已排 ${assignedShift?.shiftType}` : null,
      };
    });
  }

  // 檢查衝突
  private async checkConflicts(
    employeeId: string,
    date: string,
    shiftType: ShiftType,
  ): Promise<string[]> {
    const conflicts: string[] = [];

    // 檢查連續班次 (例如大夜接白班)
    const dateObj = new Date(date);
    const prevDate = new Date(dateObj);
    prevDate.setDate(prevDate.getDate() - 1);

    if (shiftType === ShiftType.DAY) {
      // 白班前一天不能上大夜
      const prevNight = await this.shiftRepository.findOne({
        where: {
          employeeId,
          date: prevDate,
          shiftType: ShiftType.NIGHT,
          status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
        },
      });
      if (prevNight) {
        conflicts.push('前一天已排大夜班');
      }
    }

    return conflicts;
  }

  // 取得調整日誌
  async getAdjustmentLogs(assignmentId?: string, date?: string) {
    const queryBuilder = this.logRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.operator', 'operator')
      .leftJoinAndSelect('log.assignment', 'assignment');

    if (assignmentId) {
      queryBuilder.andWhere('log.assignmentId = :assignmentId', { assignmentId });
    }

    if (date) {
      queryBuilder.andWhere('DATE(log.createdAt) = :date', { date });
    }

    return queryBuilder.orderBy('log.createdAt', 'DESC').getMany();
  }
}
