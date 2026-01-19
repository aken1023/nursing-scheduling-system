import { IsOptional, IsString, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { LeaveStatus } from '../../../entities/leave-request.entity';

export class QueryLeaveDto {
  @ApiPropertyOptional({ description: '頁碼', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每頁筆數', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: '員工 ID' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: '狀態', enum: LeaveStatus })
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @ApiPropertyOptional({ description: '開始日期' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '結束日期' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
