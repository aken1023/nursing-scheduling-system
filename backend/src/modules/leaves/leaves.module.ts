import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';
import { LeaveRequest } from '../../entities/leave-request.entity';
import { ShiftAssignment } from '../../entities/shift-assignment.entity';
import { ShiftRequirement } from '../../entities/shift-requirement.entity';
import { Notification } from '../../entities/notification.entity';
import { Employee } from '../../entities/employee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeaveRequest,
      ShiftAssignment,
      ShiftRequirement,
      Notification,
      Employee,
    ]),
  ],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeavesModule {}
