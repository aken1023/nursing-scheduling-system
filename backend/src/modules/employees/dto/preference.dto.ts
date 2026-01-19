import { IsEnum, IsOptional, IsString, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PreferenceType } from '../../../entities/employee-preference.entity';
import { ShiftType } from '../../../entities/shift-requirement.entity';

export class CreatePreferenceDto {
  @ApiProperty({ enum: PreferenceType, description: '偏好類型' })
  @IsEnum(PreferenceType)
  preferenceType: PreferenceType;

  @ApiPropertyOptional({ enum: ShiftType, description: '班別類型' })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @ApiPropertyOptional({ description: '星期幾 (0-6, 週日-週六)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: '特定日期' })
  @IsOptional()
  @IsDateString()
  specificDate?: string;

  @ApiPropertyOptional({ description: '生效起始日' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: '生效結束日' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ description: '原因說明' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdatePreferenceDto {
  @ApiPropertyOptional({ enum: PreferenceType, description: '偏好類型' })
  @IsOptional()
  @IsEnum(PreferenceType)
  preferenceType?: PreferenceType;

  @ApiPropertyOptional({ enum: ShiftType, description: '班別類型' })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @ApiPropertyOptional({ description: '星期幾 (0-6)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ description: '特定日期' })
  @IsOptional()
  @IsDateString()
  specificDate?: string;

  @ApiPropertyOptional({ description: '生效起始日' })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: '生效結束日' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ description: '原因說明' })
  @IsOptional()
  @IsString()
  reason?: string;
}
