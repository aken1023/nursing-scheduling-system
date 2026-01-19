import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { Hospital } from './hospital.entity';
import { ShiftType } from './shift-requirement.entity';

export enum CrossHospitalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('cross_hospital_requests')
export class CrossHospitalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ name: 'from_hospital_id' })
  fromHospitalId: string;

  @Column({ name: 'to_hospital_id' })
  toHospitalId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'shift_type', type: 'enum', enum: ShiftType })
  shiftType: ShiftType;

  @Column({ type: 'enum', enum: CrossHospitalStatus, default: CrossHospitalStatus.PENDING })
  status: CrossHospitalStatus;

  @Column({ name: 'requested_by' })
  requestedBy: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 關聯
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'from_hospital_id' })
  fromHospital: Hospital;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'to_hospital_id' })
  toHospital: Hospital;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'requested_by' })
  requester: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'approved_by' })
  approver: Employee;
}
