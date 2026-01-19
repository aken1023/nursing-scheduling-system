import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { ShiftType } from './shift-requirement.entity';

export enum PreferenceType {
  PREFERRED = 'preferred',
  AVOID = 'avoid',
  UNAVAILABLE = 'unavailable',
}

@Entity('employee_preferences')
export class EmployeePreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ name: 'preference_type', type: 'enum', enum: PreferenceType })
  preferenceType: PreferenceType;

  @Column({ name: 'shift_type', type: 'enum', enum: ShiftType, nullable: true })
  shiftType: ShiftType;

  @Column({ name: 'day_of_week', type: 'tinyint', nullable: true })
  dayOfWeek: number; // 0-6 (Sunday-Saturday)

  @Column({ name: 'specific_date', type: 'date', nullable: true })
  specificDate: Date;

  @Column({ name: 'effective_from', type: 'date', nullable: true })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo: Date;

  @Column({ length: 255, nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}
