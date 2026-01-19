import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateHospitalDto } from './create-hospital.dto';

export class UpdateHospitalDto extends PartialType(
  OmitType(CreateHospitalDto, ['code'] as const),
) {}
