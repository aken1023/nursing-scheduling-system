import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { PreferencesService } from './preferences.service';
import { Employee } from '../../entities/employee.entity';
import { Hospital } from '../../entities/hospital.entity';
import { EmployeePreference } from '../../entities/employee-preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Hospital, EmployeePreference])],
  controllers: [EmployeesController],
  providers: [EmployeesService, PreferencesService],
  exports: [EmployeesService, PreferencesService],
})
export class EmployeesModule {}
