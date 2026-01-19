import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LeaveRequest, LeaveStatus } from '../../entities/leave-request.entity';
import { ShiftAssignment, AssignmentStatus } from '../../entities/shift-assignment.entity';
import { ShiftRequirement } from '../../entities/shift-requirement.entity';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from '../../entities/notification.entity';
import { Employee, EmployeeStatus } from '../../entities/employee.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { QueryLeaveDto } from './dto/query-leave.dto';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(LeaveRequest)
    private leaveRepository: Repository<LeaveRequest>,
    @InjectRepository(ShiftAssignment)
    private shiftRepository: Repository<ShiftAssignment>,
    @InjectRepository(ShiftRequirement)
    private requirementRepository: Repository<ShiftRequirement>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(dto: CreateLeaveDto, employeeId: string): Promise<LeaveRequest> {
    // 檢查是否已有相同日期的請假
    const existing = await this.leaveRepository.findOne({
      where: {
        employeeId,
        leaveDate: new Date(dto.leaveDate),
        status: In([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
      },
    });
    if (existing) {
      throw new BadRequestException('該日期已有請假申請');
    }

    const leave = this.leaveRepository.create({
      ...dto,
      leaveDate: new Date(dto.leaveDate),
      employeeId,
    });

    const saved = await this.leaveRepository.save(leave);

    // 檢查影響並通知主管
    await this.checkImpactAndNotify(saved);

    return saved;
  }

  async findAll(query: QueryLeaveDto) {
    const { page = 1, limit = 20, employeeId, status, startDate, endDate } = query;

    const queryBuilder = this.leaveRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.employee', 'employee')
      .leftJoinAndSelect('leave.approver', 'approver');

    if (employeeId) {
      queryBuilder.andWhere('leave.employeeId = :employeeId', { employeeId });
    }

    if (status) {
      queryBuilder.andWhere('leave.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('leave.leaveDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('leave.createdAt', 'DESC')
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<LeaveRequest> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['employee', 'approver'],
    });
    if (!leave) {
      throw new NotFoundException('請假申請不存在');
    }
    return leave;
  }

  async approve(id: string, approverId: string): Promise<LeaveRequest> {
    const leave = await this.findOne(id);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('此申請已處理');
    }

    leave.status = LeaveStatus.APPROVED;
    leave.approvedBy = approverId;

    const saved = await this.leaveRepository.save(leave);

    // 取消該員工當天的排班
    await this.cancelShiftIfExists(leave);

    // 發送通知給員工
    await this.sendNotification(
      leave.employeeId,
      NotificationType.LEAVE_APPROVED,
      '請假已核准',
      `您 ${leave.leaveDate.toISOString().split('T')[0]} 的請假申請已核准`,
    );

    // 檢查 Leader 缺口並發送警示
    await this.checkLeaderGapAndNotify(leave);

    return saved;
  }

  async reject(id: string, approverId: string, reason: string): Promise<LeaveRequest> {
    const leave = await this.findOne(id);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('此申請已處理');
    }

    leave.status = LeaveStatus.REJECTED;
    leave.approvedBy = approverId;
    leave.rejectReason = reason;

    const saved = await this.leaveRepository.save(leave);

    // 發送通知給員工
    await this.sendNotification(
      leave.employeeId,
      NotificationType.LEAVE_REJECTED,
      '請假已駁回',
      `您 ${leave.leaveDate.toISOString().split('T')[0]} 的請假申請已駁回。原因: ${reason}`,
    );

    return saved;
  }

  async cancel(id: string, employeeId: string): Promise<void> {
    const leave = await this.findOne(id);

    if (leave.employeeId !== employeeId) {
      throw new BadRequestException('無權取消此申請');
    }

    if (leave.status === LeaveStatus.APPROVED) {
      throw new BadRequestException('已核准的請假無法取消，請聯繫主管');
    }

    await this.leaveRepository.remove(leave);
  }

  // 檢查請假影響並通知
  private async checkImpactAndNotify(leave: LeaveRequest) {
    // 檢查該員工是否為該班次的 Leader
    const shift = await this.shiftRepository.findOne({
      where: {
        employeeId: leave.employeeId,
        date: leave.leaveDate,
        status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
        ...(leave.shiftType ? { shiftType: leave.shiftType } : {}),
      },
      relations: ['hospital'],
    });

    if (shift?.isLeaderDuty) {
      // 通知主管此請假會影響 Leader
      const managers = await this.employeeRepository.find({
        where: { role: In(['admin', 'manager']), status: EmployeeStatus.ACTIVE },
      });

      for (const manager of managers) {
        await this.sendNotification(
          manager.id,
          NotificationType.LEADER_GAP,
          '請假申請需注意',
          `${leave.employeeId} 申請 ${leave.leaveDate.toISOString().split('T')[0]} ${leave.shiftType || '全天'} 請假，核准後將造成 Leader 缺口`,
          { leaveId: leave.id, shiftId: shift.id },
        );
      }
    }
  }

  // 取消排班
  private async cancelShiftIfExists(leave: LeaveRequest) {
    const shifts = await this.shiftRepository.find({
      where: {
        employeeId: leave.employeeId,
        date: leave.leaveDate,
        status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
        ...(leave.shiftType ? { shiftType: leave.shiftType } : {}),
      },
    });

    for (const shift of shifts) {
      shift.status = AssignmentStatus.CANCELLED;
      await this.shiftRepository.save(shift);
    }
  }

  // 檢查 Leader 缺口並發送警示
  private async checkLeaderGapAndNotify(leave: LeaveRequest) {
    const shifts = await this.shiftRepository.find({
      where: {
        date: leave.leaveDate,
        isLeaderDuty: true,
        status: AssignmentStatus.CANCELLED,
        employeeId: leave.employeeId,
      },
      relations: ['hospital'],
    });

    for (const shift of shifts) {
      // 檢查該時段是否還有其他 Leader
      const remainingLeaders = await this.shiftRepository.count({
        where: {
          hospitalId: shift.hospitalId,
          date: shift.date,
          shiftType: shift.shiftType,
          isLeaderDuty: true,
          status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
        },
      });

      const requirement = await this.requirementRepository.findOne({
        where: { hospitalId: shift.hospitalId, shiftType: shift.shiftType },
        order: { effectiveDate: 'DESC' },
      });

      if (remainingLeaders < (requirement?.leaderRequired || 1)) {
        // 發送 Leader 缺口警示
        const managers = await this.employeeRepository.find({
          where: { role: In(['admin', 'manager']), status: EmployeeStatus.ACTIVE },
        });

        for (const manager of managers) {
          await this.sendNotification(
            manager.id,
            NotificationType.LEADER_GAP,
            'Leader 缺口警示',
            `${shift.hospital?.name || ''} ${leave.leaveDate.toISOString().split('T')[0]} ${shift.shiftType} 班 Leader 不足`,
            {
              hospitalId: shift.hospitalId,
              date: leave.leaveDate,
              shiftType: shift.shiftType,
            },
          );
        }
      }
    }
  }

  // 發送通知
  private async sendNotification(
    recipientId: string,
    type: NotificationType,
    title: string,
    content: string,
    payload?: Record<string, any>,
  ) {
    const notification = this.notificationRepository.create({
      type,
      recipientId,
      channel: NotificationChannel.SYSTEM,
      title,
      content,
      payload,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
    await this.notificationRepository.save(notification);
  }

  // 取得待審核數量
  async getPendingCount(managerId?: string): Promise<number> {
    return this.leaveRepository.count({
      where: { status: LeaveStatus.PENDING },
    });
  }
}
