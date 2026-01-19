import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Employee } from './employee.entity';
import { ShiftRequirement } from './shift-requirement.entity';
import { ShiftAssignment } from './shift-assignment.entity';

@Entity('hospitals')
export class Hospital {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 10, unique: true })
  code: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 200, nullable: true })
  address: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 關聯
  @ManyToMany(() => Employee, (employee) => employee.hospitals)
  employees: Employee[];

  @OneToMany(() => ShiftRequirement, (requirement) => requirement.hospital)
  shiftRequirements: ShiftRequirement[];

  @OneToMany(() => ShiftAssignment, (assignment) => assignment.hospital)
  shiftAssignments: ShiftAssignment[];
}
