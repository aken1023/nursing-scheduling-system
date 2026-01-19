import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AutoScheduleDto {
  @ApiProperty({ description: '院區 ID' })
  @IsString()
  hospitalId: string;

  @ApiProperty({ description: '起始日期' })
  @IsString()
  startDate: string;

  @ApiProperty({ description: '結束日期' })
  @IsString()
  endDate: string;

  @ApiPropertyOptional({ description: '範本 ID' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: '是否遵守員工偏好', default: true })
  @IsOptional()
  @IsBoolean()
  respectPreferences?: boolean;

  @ApiPropertyOptional({ description: '是否平衡 Leader 分配', default: true })
  @IsOptional()
  @IsBoolean()
  balanceLeaders?: boolean;

  @ApiPropertyOptional({ description: '避免連續夜班天數', default: 3 })
  @IsOptional()
  maxConsecutiveNights?: number;

  @ApiPropertyOptional({ description: '是否為預覽模式', default: true })
  @IsOptional()
  @IsBoolean()
  previewOnly?: boolean;
}

export class AutoSchedulePreviewResult {
  totalShifts: number;
  filledShifts: number;
  conflictCount: number;
  gaps: Array<{
    date: string;
    shiftType: string;
    required: number;
    assigned: number;
  }>;
  assignments: Array<{
    date: string;
    shiftType: string;
    employeeId: string;
    employeeName: string;
    isLeaderDuty: boolean;
  }>;
  conflicts: Array<{
    type: string;
    description: string;
    employeeId?: string;
    employeeName?: string;
  }>;
}
