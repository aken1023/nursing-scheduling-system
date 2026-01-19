import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SwapStatus } from '../../../entities/shift-swap-request.entity';

export class CreateSwapDto {
  @ApiProperty({ description: '申請人的班別 ID' })
  @IsString()
  requesterAssignmentId: string;

  @ApiProperty({ description: '交換對象員工 ID' })
  @IsString()
  targetId: string;

  @ApiProperty({ description: '交換對象的班別 ID' })
  @IsString()
  targetAssignmentId: string;

  @ApiPropertyOptional({ description: '申請原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectSwapDto {
  @ApiProperty({ description: '駁回原因' })
  @IsString()
  rejectReason: string;
}

export class QuerySwapDto {
  @ApiPropertyOptional({ description: '申請人 ID' })
  @IsOptional()
  @IsString()
  requesterId?: string;

  @ApiPropertyOptional({ description: '交換對象 ID' })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ enum: SwapStatus, description: '狀態' })
  @IsOptional()
  @IsEnum(SwapStatus)
  status?: SwapStatus;
}
