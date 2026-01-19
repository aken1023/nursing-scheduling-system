import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ShiftAssignment } from './shift-assignment.entity';
import { Employee } from './employee.entity';

export enum AdjustmentAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SWAP = 'swap',
}

@Entity('shift_adjustment_logs')
export class ShiftAdjustmentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @Column({ type: 'enum', enum: AdjustmentAction })
  action: AdjustmentAction;

  @Column({ name: 'old_value', type: 'json', nullable: true })
  oldValue: Record<string, any>;

  @Column({ name: 'new_value', type: 'json', nullable: true })
  newValue: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'operated_by' })
  operatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 關聯
  @ManyToOne(() => ShiftAssignment, (assignment) => assignment.adjustmentLogs)
  @JoinColumn({ name: 'assignment_id' })
  assignment: ShiftAssignment;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'operated_by' })
  operator: Employee;
}
