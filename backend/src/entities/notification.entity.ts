import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

export enum NotificationType {
  LEADER_GAP = 'leader_gap',
  LEAVE_APPROVED = 'leave_approved',
  LEAVE_REJECTED = 'leave_rejected',
  CROSS_HOSPITAL_REQUEST = 'cross_hospital_request',
  SHIFT_CHANGE = 'shift_change',
  SHIFT_REMINDER = 'shift_reminder',
}

export enum NotificationChannel {
  SYSTEM = 'system',
  LINE = 'line',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  payload: Record<string, any>;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 關聯
  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'recipient_id' })
  recipient: Employee;
}
