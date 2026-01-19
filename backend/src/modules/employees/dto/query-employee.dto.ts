import { IsOptional, IsString, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { EmployeeStatus } from '../../../entities/employee.entity';

export class QueryEmployeeDto {
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

  @ApiPropertyOptional({ description: '院區 ID' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ description: '員工狀態', enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional({ description: '是否為 Leader' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isLeader?: boolean;

  @ApiPropertyOptional({ description: '關鍵字搜尋 (姓名/工號)' })
  @IsOptional()
  @IsString()
  keyword?: string;
}
