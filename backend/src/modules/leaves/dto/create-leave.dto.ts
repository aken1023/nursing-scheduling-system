import { IsNotEmpty, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '../../../entities/leave-request.entity';
import { ShiftType } from '../../../entities/shift-requirement.entity';

export class CreateLeaveDto {
  @ApiProperty({ description: '請假日期', example: '2024-01-15' })
  @IsDateString()
  leaveDate: string;

  @ApiPropertyOptional({ description: '請假班別 (空=全天)', enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @ApiProperty({ description: '假別', enum: LeaveType })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiPropertyOptional({ description: '請假原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}
