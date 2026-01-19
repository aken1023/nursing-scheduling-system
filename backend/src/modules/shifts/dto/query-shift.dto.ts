import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType } from '../../../entities/shift-requirement.entity';

export class QueryShiftDto {
  @ApiPropertyOptional({ description: '院區 ID' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ description: '開始日期', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '結束日期', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '員工 ID' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: '班別類型', enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;
}
