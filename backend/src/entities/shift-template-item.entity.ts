import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ShiftTemplate } from './shift-template.entity';

export enum TemplateShiftType {
  DAY = 'DAY',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
  OFF = 'OFF',
}

@Entity('shift_template_items')
export class ShiftTemplateItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ name: 'day_index' })
  dayIndex: number; // 0-based day in cycle

  @Column({ name: 'shift_type', type: 'enum', enum: TemplateShiftType })
  shiftType: TemplateShiftType;

  @Column({ name: 'required_count', default: 1 })
  requiredCount: number;

  @Column({ name: 'leader_required', default: 0 })
  leaderRequired: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ShiftTemplate, (template) => template.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: ShiftTemplate;
}
