import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { ShiftAssignment } from '../../entities/shift-assignment.entity';
import { ShiftAdjustmentLog } from '../../entities/shift-adjustment-log.entity';
import { ShiftRequirement } from '../../entities/shift-requirement.entity';
import { Employee } from '../../entities/employee.entity';
import { LeaveRequest } from '../../entities/leave-request.entity';
import { MonitorService } from './monitor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShiftAssignment,
      ShiftAdjustmentLog,
      ShiftRequirement,
      Employee,
      LeaveRequest,
    ]),
  ],
  controllers: [ShiftsController],
  providers: [ShiftsService, MonitorService],
  exports: [ShiftsService, MonitorService],
})
export class ShiftsModule {}
