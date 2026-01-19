import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType } from '../../../entities/shift-requirement.entity';

export class CreateShiftDto {
  @ApiProperty({ description: '排班日期', example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: '院區 ID' })
  @IsNotEmpty()
  @IsString()
  hospitalId: string;

  @ApiProperty({ description: '班別類型', enum: ShiftType })
  @IsEnum(ShiftType)
  shiftType: ShiftType;

  @ApiProperty({ description: '員工 ID' })
  @IsNotEmpty()
  @IsString()
  employeeId: string;

  @ApiPropertyOptional({ description: '是否擔任 Leader', default: false })
  @IsOptional()
  @IsBoolean()
  isLeaderDuty?: boolean;

  @ApiPropertyOptional({ description: '是否跨院支援', default: false })
  @IsOptional()
  @IsBoolean()
  isCrossHospital?: boolean;

  @ApiPropertyOptional({ description: '原屬院區 ID (跨院時)' })
  @IsOptional()
  @IsString()
  sourceHospitalId?: string;
}
