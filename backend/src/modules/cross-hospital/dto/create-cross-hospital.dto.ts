import { IsNotEmpty, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShiftType } from '../../../entities/shift-requirement.entity';

export class CreateCrossHospitalDto {
  @ApiProperty({ description: '被調度員工 ID' })
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiProperty({ description: '原院區 ID' })
  @IsNotEmpty()
  @IsString()
  fromHospitalId: string;

  @ApiProperty({ description: '目標院區 ID' })
  @IsNotEmpty()
  @IsString()
  toHospitalId: string;

  @ApiProperty({ description: '支援日期', example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: '支援班別', enum: ShiftType })
  @IsEnum(ShiftType)
  shiftType: ShiftType;
}
