import { IsOptional, IsString, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { CrossHospitalStatus } from '../../../entities/cross-hospital-request.entity';

export class QueryCrossHospitalDto {
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

  @ApiPropertyOptional({ description: '狀態', enum: CrossHospitalStatus })
  @IsOptional()
  @IsEnum(CrossHospitalStatus)
  status?: CrossHospitalStatus;

  @ApiPropertyOptional({ description: '原院區 ID' })
  @IsOptional()
  @IsString()
  fromHospitalId?: string;

  @ApiPropertyOptional({ description: '目標院區 ID' })
  @IsOptional()
  @IsString()
  toHospitalId?: string;

  @ApiPropertyOptional({ description: '日期' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
