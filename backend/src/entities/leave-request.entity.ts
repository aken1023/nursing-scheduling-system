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

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  PERSONAL = 'personal',
  OTHER = 'other',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ name: 'leave_date', type: 'date' })
  leaveDate: Date;

  @Column({ name: 'shift_type', type: 'enum', enum: ShiftType, nullable: true })
  shiftType: ShiftType;

  @Column({ name: 'leave_type', type: 'enum', enum: LeaveType })
  leaveType: LeaveType;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'enum', enum: LeaveStatus, default: LeaveStatus.PENDING })
  status: LeaveStatus;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 關聯
  @ManyToOne(() => Employee, (employee) => employee.leaveRequests)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'approved_by' })
  approver: Employee;
}
