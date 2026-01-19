import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Hospital } from './hospital.entity';
import { Employee } from './employee.entity';
import { ShiftTemplateItem } from './shift-template-item.entity';

@Entity('shift_templates')
export class ShiftTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'hospital_id' })
  hospitalId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'cycle_days', default: 7 })
  cycleDays: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'created_by' })
  creator: Employee;

  @OneToMany(() => ShiftTemplateItem, (item) => item.template, { cascade: true })
  items: ShiftTemplateItem[];
}
