import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HospitalsService } from './hospitals.service';
import { HospitalsController } from './hospitals.controller';
import { Hospital } from '../../entities/hospital.entity';
import { ShiftRequirement } from '../../entities/shift-requirement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hospital, ShiftRequirement])],
  controllers: [HospitalsController],
  providers: [HospitalsService],
  exports: [HospitalsService],
})
export class HospitalsModule {}
