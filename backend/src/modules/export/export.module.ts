import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { ShiftAssignment } from '../../entities/shift-assignment.entity';
import { Employee } from '../../entities/employee.entity';
import { Hospital } from '../../entities/hospital.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShiftAssignment, Employee, Hospital])],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
