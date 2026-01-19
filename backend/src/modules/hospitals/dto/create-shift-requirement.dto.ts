import { IsNotEmpty, IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType } from '../../../entities/shift-requirement.entity';

export class CreateShiftRequirementDto {
  @ApiPropertyOptional({ description: '院區 ID' })
  @IsOptional()
  hospitalId?: string;

  @ApiProperty({ description: '班別類型', enum: ShiftType })
  @IsEnum(ShiftType)
  shiftType: ShiftType;

  @ApiProperty({ description: '需求人數', example: 3 })
  @IsNumber()
  requiredCount: number;

  @ApiPropertyOptional({ description: '男性上限' })
  @IsOptional()
  @IsNumber()
  maleMax?: number;

  @ApiPropertyOptional({ description: '女性上限' })
  @IsOptional()
  @IsNumber()
  femaleMax?: number;

  @ApiProperty({ description: 'Leader 需求數', example: 1 })
  @IsNumber()
  leaderRequired: number;

  @ApiProperty({ description: '生效日期', example: '2024-01-01' })
  @IsDateString()
  effectiveDate: string;
}
