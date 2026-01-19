import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrossHospitalService } from './cross-hospital.service';
import { CrossHospitalController } from './cross-hospital.controller';
import { CrossHospitalRequest } from '../../entities/cross-hospital-request.entity';
import { ShiftAssignment } from '../../entities/shift-assignment.entity';
import { Employee } from '../../entities/employee.entity';
import { Hospital } from '../../entities/hospital.entity';
import { Notification } from '../../entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrossHospitalRequest,
      ShiftAssignment,
      Employee,
      Hospital,
      Notification,
    ]),
  ],
  controllers: [CrossHospitalController],
  providers: [CrossHospitalService],
  exports: [CrossHospitalService],
})
export class CrossHospitalModule {}
