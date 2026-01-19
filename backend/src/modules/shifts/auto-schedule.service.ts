import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { AutoScheduleRun, ScheduleRunStatus } from '../../entities/auto-schedule-run.entity';
import { ShiftAssignment, AssignmentStatus } from '../../entities/shift-assignment.entity';
import { ShiftRequirement, ShiftType } from '../../entities/shift-requirement.entity';
import { Employee, EmployeeStatus } from '../../entities/employee.entity';
import { LeaveRequest } from '../../entities/leave-request.entity';
import { ShiftTemplate } from '../../entities/shift-template.entity';
import { PreferencesService } from '../employees/preferences.service';
import { AutoScheduleDto, AutoSchedulePreviewResult } from './dto/auto-schedule.dto';

interface EmployeeScore {
  employee: Employee;
  score: number;
  consecutiveNights: number;
  totalShifts: number;
}

@Injectable()
export class AutoScheduleService {
  constructor(
    @InjectRepository(AutoScheduleRun)
    private runRepository: Repository<AutoScheduleRun>,
    @InjectRepository(ShiftAssignment)
    private assignmentRepository: Repository<ShiftAssignment>,
    @InjectRepository(ShiftRequirement)
    private requirementRepository: Repository<ShiftRequirement>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(LeaveRequest)
    private leaveRepository: Repository<LeaveRequest>,
    @InjectRepository(ShiftTemplate)
    private templateRepository: Repository<ShiftTemplate>,
    private preferencesService: PreferencesService,
  ) {}

  async preview(dto: AutoScheduleDto, operatorId: string): Promise<AutoSchedulePreviewResult> {
    return this.generateSchedule(dto, operatorId, true);
  }

  async execute(dto: AutoScheduleDto, operatorId: string): Promise<AutoScheduleRun> {
    // 建立執行記錄
    const run = this.runRepository.create({
      hospitalId: dto.hospitalId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      templateId: dto.templateId,
      initiatedBy: operatorId,
      status: ScheduleRunStatus.RUNNING,
      startedAt: new Date(),
    });

    const savedRun = await this.runRepository.save(run);

    try {
      const result = await this.generateSchedule(dto, operatorId, false);

      savedRun.status = ScheduleRunStatus.COMPLETED;
      savedRun.completedAt = new Date();
      savedRun.totalShifts = result.totalShifts;
      savedRun.filledShifts = result.filledShifts;
      savedRun.conflictCount = result.conflictCount;
      savedRun.resultSummary = {
        gaps: result.gaps,
        conflicts: result.conflicts,
      };

      return this.runRepository.save(savedRun);
    } catch (error) {
      savedRun.status = ScheduleRunStatus.FAILED;
      savedRun.completedAt = new Date();
      savedRun.resultSummary = { error: error.message };
      await this.runRepository.save(savedRun);
      throw error;
    }
  }

  private async generateSchedule(
    dto: AutoScheduleDto,
    operatorId: string,
    previewOnly: boolean,
  ): Promise<AutoSchedulePreviewResult> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const hospitalId = dto.hospitalId;

    // 取得需求設定
    const requirements = await this.requirementRepository.find({
      where: { hospitalId },
      order: { effectiveDate: 'DESC' },
    });

    // 取得可用員工
    const employees = await this.employeeRepository
      .createQueryBuilder('emp')
      .leftJoin('emp.hospitals', 'hospital')
      .where('hospital.id = :hospitalId', { hospitalId })
      .andWhere('emp.status = :status', { status: EmployeeStatus.ACTIVE })
      .getMany();

    // 取得請假記錄
    const leaves = await this.leaveRepository.find({
      where: {
        leaveDate: Between(startDate, endDate),
        status: 'approved',
      },
    });

    const leaveMap = new Map<string, Set<string>>();
    for (const leave of leaves) {
      const key = `${leave.employeeId}_${leave.leaveDate.toISOString().split('T')[0]}`;
      if (!leaveMap.has(key)) leaveMap.set(key, new Set());
      const leaveSet = leaveMap.get(key)!;
      if (leave.shiftType) {
        leaveSet.add(leave.shiftType);
      } else {
        leaveSet.add('ALL');
      }
    }

    // 取得現有排班
    const existingAssignments = await this.assignmentRepository.find({
      where: {
        hospitalId,
        date: Between(startDate, endDate),
        status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
      },
    });

    const existingMap = new Map<string, ShiftAssignment[]>();
    for (const assignment of existingAssignments) {
      const key = `${assignment.date.toISOString().split('T')[0]}_${assignment.shiftType}`;
      if (!existingMap.has(key)) existingMap.set(key, []);
      existingMap.get(key)!.push(assignment);
    }

    // 追蹤員工排班狀態
    const employeeStats = new Map<string, EmployeeScore>();
    for (const emp of employees) {
      employeeStats.set(emp.id, {
        employee: emp,
        score: 0,
        consecutiveNights: 0,
        totalShifts: 0,
      });
    }

    const result: AutoSchedulePreviewResult = {
      totalShifts: 0,
      filledShifts: 0,
      conflictCount: 0,
      gaps: [],
      assignments: [],
      conflicts: [],
    };

    const newAssignments: Partial<ShiftAssignment>[] = [];

    // 遍歷日期
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      for (const shiftType of [ShiftType.DAY, ShiftType.EVENING, ShiftType.NIGHT]) {
        const requirement = requirements.find((r) => r.shiftType === shiftType);
        if (!requirement) continue;

        const key = `${dateStr}_${shiftType}`;
        const existing = existingMap.get(key) || [];
        const currentCount = existing.length;
        const neededCount = requirement.requiredCount - currentCount;

        result.totalShifts += requirement.requiredCount;
        result.filledShifts += currentCount;

        if (neededCount <= 0) continue;

        // 計算每個員工的分數
        const candidates: EmployeeScore[] = [];

        for (const emp of employees) {
          // 檢查是否請假
          const leaveKey = `${emp.id}_${dateStr}`;
          const empLeaves = leaveMap.get(leaveKey);
          if (empLeaves && (empLeaves.has('ALL') || empLeaves.has(shiftType))) {
            continue;
          }

          // 檢查是否已排班
          const alreadyAssigned = existing.some((a) => a.employeeId === emp.id);
          if (alreadyAssigned) continue;

          // 檢查能力
          if (shiftType === ShiftType.NIGHT && !emp.canNight) continue;
          if (shiftType === ShiftType.DAY && !emp.canDay) continue;

          // 檢查偏好
          if (dto.respectPreferences !== false) {
            const canSchedule = await this.preferencesService.canSchedule(
              emp.id,
              currentDate,
              shiftType,
            );
            if (!canSchedule.canSchedule) {
              result.conflicts.push({
                type: 'PREFERENCE',
                description: canSchedule.reason,
                employeeId: emp.id,
                employeeName: emp.name,
              });
              continue;
            }
          }

          const stats = employeeStats.get(emp.id)!;

          // 檢查連續夜班
          if (
            shiftType === ShiftType.NIGHT &&
            stats.consecutiveNights >= (dto.maxConsecutiveNights || 3)
          ) {
            continue;
          }

          // 計算分數
          let score = 0;

          // 偏好分數
          if (dto.respectPreferences !== false) {
            score += await this.preferencesService.getPreferenceScore(
              emp.id,
              currentDate,
              shiftType,
            );
          }

          // 平衡分數 (班少的優先)
          score -= stats.totalShifts * 2;

          // Leader 優先分配到需要 Leader 的班
          if ((emp.isLeader || emp.isDeputy) && requirement.leaderRequired > 0) {
            const leaderCount = existing.filter((a) => a.isLeaderDuty).length;
            if (leaderCount < requirement.leaderRequired) {
              score += 5;
            }
          }

          candidates.push({
            ...stats,
            score,
          });
        }

        // 按分數排序
        candidates.sort((a, b) => b.score - a.score);

        // 分配員工
        let assigned = 0;
        for (const candidate of candidates) {
          if (assigned >= neededCount) break;

          const isLeader =
            (candidate.employee.isLeader || candidate.employee.isDeputy) &&
            existing.filter((a) => a.isLeaderDuty).length < requirement.leaderRequired;

          const assignment: Partial<ShiftAssignment> = {
            date: new Date(currentDate),
            hospitalId,
            shiftType,
            employeeId: candidate.employee.id,
            isLeaderDuty: isLeader,
            status: AssignmentStatus.SCHEDULED,
            createdBy: operatorId,
          };

          result.assignments.push({
            date: dateStr,
            shiftType,
            employeeId: candidate.employee.id,
            employeeName: candidate.employee.name,
            isLeaderDuty: isLeader,
          });

          newAssignments.push(assignment);

          // 更新統計
          const empStats = employeeStats.get(candidate.employee.id)!;
          empStats.totalShifts++;
          if (shiftType === ShiftType.NIGHT) {
            empStats.consecutiveNights++;
          } else {
            empStats.consecutiveNights = 0;
          }

          assigned++;
          result.filledShifts++;
        }

        // 記錄缺口
        if (assigned < neededCount) {
          result.gaps.push({
            date: dateStr,
            shiftType,
            required: requirement.requiredCount,
            assigned: currentCount + assigned,
          });
          result.conflictCount++;
        }
      }

      // 重置非夜班員工的連續夜班計數
      for (const [empId, stats] of employeeStats) {
        const todayNight = newAssignments.find(
          (a) =>
            a.employeeId === empId &&
            a.shiftType === ShiftType.NIGHT &&
            a.date && a.date.toISOString().split('T')[0] === dateStr,
        );
        if (!todayNight) {
          stats.consecutiveNights = 0;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 儲存排班
    if (!previewOnly && newAssignments.length > 0) {
      for (const assignment of newAssignments) {
        const entity = this.assignmentRepository.create(assignment);
        await this.assignmentRepository.save(entity);
      }
    }

    return result;
  }

  async findAllRuns(hospitalId?: string): Promise<AutoScheduleRun[]> {
    const where: any = {};
    if (hospitalId) where.hospitalId = hospitalId;

    return this.runRepository.find({
      where,
      relations: ['hospital', 'template', 'initiator'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findOneRun(id: string): Promise<AutoScheduleRun> {
    const run = await this.runRepository.findOne({
      where: { id },
      relations: ['hospital', 'template', 'initiator'],
    });

    if (!run) {
      throw new NotFoundException('排班執行記錄不存在');
    }

    return run;
  }
}
