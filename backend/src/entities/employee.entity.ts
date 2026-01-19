import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Hospital } from './hospital.entity';
import { ShiftAssignment } from './shift-assignment.entity';
import { LeaveRequest } from './leave-request.entity';

export enum Gender {
  M = 'M',
  F = 'F',
}

export enum EmployeeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_no', length: 20, unique: true })
  employeeNo: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ name: 'password_hash', length: 255, nullable: true })
  passwordHash: string;

  @Column({ name: 'can_day', default: true })
  canDay: boolean;

  @Column({ name: 'can_night', default: true })
  canNight: boolean;

  @Column({ name: 'is_leader', default: false })
  isLeader: boolean;

  @Column({ name: 'is_deputy', default: false })
  isDeputy: boolean;

  @Column({ name: 'max_daily_shift', nullable: true })
  maxDailyShift: number;

  @Column({ name: 'max_consecutive_days', nullable: true })
  maxConsecutiveDays: number;

  @Column({ type: 'enum', enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
  status: EmployeeStatus;

  @Column({ length: 50, nullable: true })
  role: string; // admin, manager, staff

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 關聯
  @ManyToMany(() => Hospital, (hospital) => hospital.employees)
  @JoinTable({
    name: 'employee_hospitals',
    joinColumn: { name: 'employee_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hospital_id', referencedColumnName: 'id' },
  })
  hospitals: Hospital[];

  @OneToMany(() => ShiftAssignment, (assignment) => assignment.employee)
  shiftAssignments: ShiftAssignment[];

  @OneToMany(() => LeaveRequest, (leave) => leave.employee)
  leaveRequests: LeaveRequest[];
}
