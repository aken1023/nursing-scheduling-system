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
import { ShiftAssignment } from './shift-assignment.entity';

export enum SwapStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('shift_swap_requests')
export class ShiftSwapRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'requester_id' })
  requesterId: string;

  @Column({ name: 'requester_assignment_id' })
  requesterAssignmentId: string;

  @Column({ name: 'target_id' })
  targetId: string;

  @Column({ name: 'target_assignment_id' })
  targetAssignmentId: string;

  @Column({ type: 'enum', enum: SwapStatus, default: SwapStatus.PENDING })
  status: SwapStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'reject_reason', length: 255, nullable: true })
  rejectReason: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'requester_id' })
  requester: Employee;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'target_id' })
  target: Employee;

  @ManyToOne(() => ShiftAssignment)
  @JoinColumn({ name: 'requester_assignment_id' })
  requesterAssignment: ShiftAssignment;

  @ManyToOne(() => ShiftAssignment)
  @JoinColumn({ name: 'target_assignment_id' })
  targetAssignment: ShiftAssignment;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'approved_by' })
  approver: Employee;
}
