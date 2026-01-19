import { IsOptional, IsBoolean, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '../../../entities/shift-assignment.entity';

export class UpdateShiftDto {
  @ApiPropertyOptional({ description: '是否擔任 Leader' })
  @IsOptional()
  @IsBoolean()
  isLeaderDuty?: boolean;

  @ApiPropertyOptional({ description: '狀態', enum: AssignmentStatus })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ description: '調整原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}
