import { IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TemplateShiftType } from '../../../entities/shift-template-item.entity';

export class TemplateItemDto {
  @ApiProperty({ description: '週期內第幾天 (0-based)' })
  @IsInt()
  @Min(0)
  dayIndex: number;

  @ApiProperty({ enum: TemplateShiftType, description: '班別類型' })
  @IsEnum(TemplateShiftType)
  shiftType: TemplateShiftType;

  @ApiPropertyOptional({ description: '需求人數', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  requiredCount?: number;

  @ApiPropertyOptional({ description: 'Leader 需求數', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  leaderRequired?: number;
}

export class CreateTemplateDto {
  @ApiProperty({ description: '範本名稱' })
  @IsString()
  name: string;

  @ApiProperty({ description: '院區 ID' })
  @IsString()
  hospitalId: string;

  @ApiPropertyOptional({ description: '範本描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '週期天數', default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  cycleDays?: number;

  @ApiPropertyOptional({ description: '範本項目' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items?: TemplateItemDto[];
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: '範本名稱' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '範本描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '週期天數' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  cycleDays?: number;

  @ApiPropertyOptional({ description: '是否啟用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '範本項目' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items?: TemplateItemDto[];
}

export class ApplyTemplateDto {
  @ApiProperty({ description: '起始日期' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: '結束日期' })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({ description: '是否為預覽模式', default: false })
  @IsOptional()
  @IsBoolean()
  previewOnly?: boolean;
}

export class QueryTemplateDto {
  @ApiPropertyOptional({ description: '院區 ID' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ description: '是否只顯示啟用的範本' })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;
}
