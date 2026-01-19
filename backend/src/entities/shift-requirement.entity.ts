import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hospital } from './hospital.entity';

export enum ShiftType {
  DAY = 'DAY',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
}

@Entity('shift_requirements')
export class ShiftRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hospital_id' })
  hospitalId: string;

  @Column({ name: 'shift_type', type: 'enum', enum: ShiftType })
  shiftType: ShiftType;

  @Column({ name: 'required_count', default: 1 })
  requiredCount: number;

  @Column({ name: 'male_max', nullable: true })
  maleMax: number;

  @Column({ name: 'female_max', nullable: true })
  femaleMax: number;

  @Column({ name: 'leader_required', default: 1 })
  leaderRequired: number;

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: Date;

  // 關聯
  @ManyToOne(() => Hospital, (hospital) => hospital.shiftRequirements)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;
}
