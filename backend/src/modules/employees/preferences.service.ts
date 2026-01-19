import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { EmployeePreference, PreferenceType } from '../../entities/employee-preference.entity';
import { ShiftType } from '../../entities/shift-requirement.entity';
import { CreatePreferenceDto, UpdatePreferenceDto } from './dto/preference.dto';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(EmployeePreference)
    private preferenceRepository: Repository<EmployeePreference>,
  ) {}

  async findByEmployee(employeeId: string): Promise<EmployeePreference[]> {
    return this.preferenceRepository.find({
      where: { employeeId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(employeeId: string, dto: CreatePreferenceDto): Promise<EmployeePreference> {
    const preference = this.preferenceRepository.create({
      employeeId,
      ...dto,
    });
    return this.preferenceRepository.save(preference);
  }

  async update(employeeId: string, prefId: string, dto: UpdatePreferenceDto): Promise<EmployeePreference> {
    const preference = await this.preferenceRepository.findOne({
      where: { id: prefId, employeeId },
    });

    if (!preference) {
      throw new NotFoundException('偏好設定不存在');
    }

    Object.assign(preference, dto);
    return this.preferenceRepository.save(preference);
  }

  async remove(employeeId: string, prefId: string): Promise<void> {
    const preference = await this.preferenceRepository.findOne({
      where: { id: prefId, employeeId },
    });

    if (!preference) {
      throw new NotFoundException('偏好設定不存在');
    }

    await this.preferenceRepository.remove(preference);
  }

  // 取得員工在特定日期的偏好設定
  async getPreferencesForDate(
    employeeId: string,
    date: Date,
    shiftType?: ShiftType,
  ): Promise<EmployeePreference[]> {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    const queryBuilder = this.preferenceRepository
      .createQueryBuilder('pref')
      .where('pref.employee_id = :employeeId', { employeeId })
      .andWhere(
        '(pref.effective_from IS NULL OR pref.effective_from <= :date)',
        { date: dateStr },
      )
      .andWhere(
        '(pref.effective_to IS NULL OR pref.effective_to >= :date)',
        { date: dateStr },
      )
      .andWhere(
        '(pref.specific_date = :date OR pref.day_of_week = :dayOfWeek OR (pref.specific_date IS NULL AND pref.day_of_week IS NULL))',
        { date: dateStr, dayOfWeek },
      );

    if (shiftType) {
      queryBuilder.andWhere(
        '(pref.shift_type = :shiftType OR pref.shift_type IS NULL)',
        { shiftType },
      );
    }

    return queryBuilder.getMany();
  }

  // 檢查員工是否可以排班
  async canSchedule(
    employeeId: string,
    date: Date,
    shiftType: ShiftType,
  ): Promise<{ canSchedule: boolean; reason?: string }> {
    const preferences = await this.getPreferencesForDate(employeeId, date, shiftType);

    for (const pref of preferences) {
      if (pref.preferenceType === PreferenceType.UNAVAILABLE) {
        return {
          canSchedule: false,
          reason: pref.reason || '員工標記為不可排班',
        };
      }
    }

    return { canSchedule: true };
  }

  // 取得員工對特定班別的偏好程度 (用於自動排班)
  async getPreferenceScore(
    employeeId: string,
    date: Date,
    shiftType: ShiftType,
  ): Promise<number> {
    const preferences = await this.getPreferencesForDate(employeeId, date, shiftType);

    let score = 0;
    for (const pref of preferences) {
      switch (pref.preferenceType) {
        case PreferenceType.PREFERRED:
          score += 10;
          break;
        case PreferenceType.AVOID:
          score -= 5;
          break;
        case PreferenceType.UNAVAILABLE:
          score -= 100;
          break;
      }
    }

    return score;
  }
}
