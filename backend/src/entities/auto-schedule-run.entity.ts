import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hospital } from './hospital.entity';
import { ShiftTemplate } from './shift-template.entity';
import { Employee } from './employee.entity';

export enum ScheduleRunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('auto_schedule_runs')
export class AutoScheduleRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hospital_id' })
  hospitalId: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'template_id', nullable: true })
  templateId: string;

  @Column({ type: 'enum', enum: ScheduleRunStatus, default: ScheduleRunStatus.PENDING })
  status: ScheduleRunStatus;

  @Column({ name: 'total_shifts', default: 0 })
  totalShifts: number;

  @Column({ name: 'filled_shifts', default: 0 })
  filledShifts: number;

  @Column({ name: 'conflict_count', default: 0 })
  conflictCount: number;

  @Column({ name: 'result_summary', type: 'json', nullable: true })
  resultSummary: any;

  @Column({ name: 'initiated_by', nullable: true })
  initiatedBy: string;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @ManyToOne(() => ShiftTemplate)
  @JoinColumn({ name: 'template_id' })
  template: ShiftTemplate;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'initiated_by' })
  initiator: Employee;
}
