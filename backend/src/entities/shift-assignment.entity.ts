import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Hospital } from './hospital.entity';
import { Employee } from './employee.entity';
import { ShiftType } from './shift-requirement.entity';
import { ShiftAdjustmentLog } from './shift-adjustment-log.entity';

export enum AssignmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('shift_assignments')
export class ShiftAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'hospital_id' })
  hospitalId: string;

  @Column({ name: 'shift_type', type: 'enum', enum: ShiftType })
  shiftType: ShiftType;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @Column({ name: 'is_leader_duty', default: false })
  isLeaderDuty: boolean;

  @Column({ name: 'is_cross_hospital', default: false })
  isCrossHospital: boolean;

  @Column({ name: 'source_hospital_id', nullable: true })
  sourceHospitalId: string;

  @Column({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.SCHEDULED })
  status: AssignmentStatus;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 關聯
  @ManyToOne(() => Hospital, (hospital) => hospital.shiftAssignments)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @ManyToOne(() => Employee, (employee) => employee.shiftAssignments)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'source_hospital_id' })
  sourceHospital: Hospital;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'created_by' })
  creator: Employee;

  @OneToMany(() => ShiftAdjustmentLog, (log) => log.assignment)
  adjustmentLogs: ShiftAdjustmentLog[];
}
