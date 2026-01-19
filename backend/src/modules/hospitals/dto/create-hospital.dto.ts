import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHospitalDto {
  @ApiProperty({ description: '院區代碼', example: 'SH' })
  @IsNotEmpty({ message: '院區代碼不能為空' })
  @IsString()
  code: string;

  @ApiProperty({ description: '院區名稱', example: '雙和院區' })
  @IsNotEmpty({ message: '院區名稱不能為空' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '地址' })
  @IsOptional()
  @IsString()
  address?: string;
}
