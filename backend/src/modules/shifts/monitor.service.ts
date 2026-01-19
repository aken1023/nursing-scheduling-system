import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ShiftAssignment, AssignmentStatus } from '../../entities/shift-assignment.entity';
import { ShiftRequirement, ShiftType } from '../../entities/shift-requirement.entity';
import { Employee } from '../../entities/employee.entity';
import { Hospital } from '../../entities/hospital.entity';

export interface LeaderGap {
  date: Date;
  hospitalId: string;
  hospitalName: string;
  shiftType: ShiftType;
  required: number;
  assigned: number;
  gap: number;
  suggestedLeaders: Array<{ id: string; name: string }>;
}

@Injectable()
export class MonitorService {
  constructor(
    @InjectRepository(ShiftAssignment)
    private shiftRepository: Repository<ShiftAssignment>,
    @InjectRepository(ShiftRequirement)
    private requirementRepository: Repository<ShiftRequirement>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  // 檢查 Leader 缺口
  async checkLeaderGaps(startDate: Date, endDate: Date): Promise<LeaderGap[]> {
    const gaps: LeaderGap[] = [];

    // 取得所有院區
    const hospitals = await this.shiftRepository
      .createQueryBuilder('shift')
      .select('shift.hospital_id', 'hospitalId')
      .leftJoin('shift.hospital', 'hospital')
      .addSelect('hospital.name', 'hospitalName')
      .groupBy('shift.hospital_id')
      .addGroupBy('hospital.name')
      .getRawMany();

    for (const { hospitalId, hospitalName } of hospitals) {
      // 取得該院區的需求設定
      const requirements = await this.requirementRepository.find({
        where: { hospitalId },
        order: { effectiveDate: 'DESC' },
      });

      // 檢查每一天
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        for (const shiftType of [ShiftType.DAY, ShiftType.EVENING, ShiftType.NIGHT]) {
          const requirement = requirements.find((r) => r.shiftType === shiftType);
          if (!requirement || requirement.leaderRequired === 0) continue;

          // 取得該時段的 Leader 排班
          const leaderShifts = await this.shiftRepository.count({
            where: {
              hospitalId,
              date: currentDate,
              shiftType,
              isLeaderDuty: true,
              status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
            },
          });

          if (leaderShifts < requirement.leaderRequired) {
            // 取得建議的 Leader 人選
            const suggestedLeaders = await this.getSuggestedLeaders(
              hospitalId,
              currentDate,
              shiftType,
            );

            gaps.push({
              date: new Date(currentDate),
              hospitalId,
              hospitalName,
              shiftType,
              required: requirement.leaderRequired,
              assigned: leaderShifts,
              gap: requirement.leaderRequired - leaderShifts,
              suggestedLeaders,
            });
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return gaps;
  }

  // 取得建議的 Leader 人選
  private async getSuggestedLeaders(
    hospitalId: string,
    date: Date,
    shiftType: ShiftType,
  ): Promise<Array<{ id: string; name: string }>> {
    // 取得該院區可用的 Leader
    const leaders = await this.employeeRepository
      .createQueryBuilder('emp')
      .leftJoin('emp.hospitals', 'hospital')
      .where('hospital.id = :hospitalId', { hospitalId })
      .andWhere('(emp.isLeader = true OR emp.isDeputy = true)')
      .andWhere('emp.status = :status', { status: 'active' })
      .getMany();

    // 過濾掉當天已有排班的 Leader
    const assignedIds = await this.shiftRepository
      .createQueryBuilder('shift')
      .select('shift.employeeId')
      .where('shift.date = :date', { date })
      .andWhere('shift.status IN (:...statuses)', {
        statuses: [AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED],
      })
      .getRawMany();

    const assignedSet = new Set(assignedIds.map((a) => a.shift_employee_id));

    return leaders
      .filter((l) => !assignedSet.has(l.id))
      .slice(0, 5)
      .map((l) => ({ id: l.id, name: l.name }));
  }

  // 取得監控儀表板資料
  async getDashboardData(hospitalId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // 今日出勤人數
    const todayShifts = await this.shiftRepository.count({
      where: {
        date: today,
        status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
        ...(hospitalId ? { hospitalId } : {}),
      },
    });

    // Leader 缺口
    const leaderGaps = await this.checkLeaderGaps(today, nextWeek);
    const filteredGaps = hospitalId
      ? leaderGaps.filter((g) => g.hospitalId === hospitalId)
      : leaderGaps;

    // 人力充足率
    const requirements = await this.requirementRepository.find({
      ...(hospitalId ? { where: { hospitalId } } : {}),
    });

    let totalRequired = 0;
    let totalAssigned = 0;

    for (const req of requirements) {
      totalRequired += req.requiredCount;
      const assigned = await this.shiftRepository.count({
        where: {
          hospitalId: req.hospitalId,
          date: today,
          shiftType: req.shiftType,
          status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
        },
      });
      totalAssigned += Math.min(assigned, req.requiredCount);
    }

    return {
      todayShifts,
      leaderGaps: filteredGaps,
      leaderGapCount: filteredGaps.length,
      coverageRate: totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 100,
    };
  }
}
