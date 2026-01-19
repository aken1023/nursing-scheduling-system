import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ShiftItem {
  @ApiPropertyOptional({ description: '操作類型: create | delete' })
  action?: 'create' | 'delete';

  @ApiPropertyOptional({ description: '排班 ID (刪除時需要)' })
  id?: string;

  @ApiPropertyOptional({ description: '日期' })
  date?: string;

  @ApiPropertyOptional({ description: '院區 ID' })
  hospitalId?: string;

  @ApiPropertyOptional({ description: '班別' })
  shiftType?: string;

  @ApiPropertyOptional({ description: '員工 ID' })
  employeeId?: string;

  @ApiPropertyOptional({ description: '是否 Leader' })
  isLeaderDuty?: boolean;
}

export class BatchUpdateShiftDto {
  @ApiProperty({ description: '排班異動列表', type: [ShiftItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftItem)
  assignments: ShiftItem[];

  @ApiPropertyOptional({ description: '調整原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}
