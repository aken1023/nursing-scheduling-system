import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../../../entities/employee.entity';

export class CreateEmployeeDto {
  @ApiProperty({ description: '工號', example: 'A001' })
  @IsNotEmpty({ message: '工號不能為空' })
  @IsString()
  employeeNo: string;

  @ApiProperty({ description: '姓名', example: '王小明' })
  @IsNotEmpty({ message: '姓名不能為空' })
  @IsString()
  name: string;

  @ApiProperty({ description: '性別', enum: Gender, example: 'M' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({ description: '手機號碼', example: '0912345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '電子郵件', example: 'employee@hospital.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '可上白班', default: true })
  @IsOptional()
  @IsBoolean()
  canDay?: boolean;

  @ApiPropertyOptional({ description: '可上夜班', default: true })
  @IsOptional()
  @IsBoolean()
  canNight?: boolean;

  @ApiPropertyOptional({ description: '是否為 Leader', default: false })
  @IsOptional()
  @IsBoolean()
  isLeader?: boolean;

  @ApiPropertyOptional({ description: '是否為代理 Leader', default: false })
  @IsOptional()
  @IsBoolean()
  isDeputy?: boolean;

  @ApiPropertyOptional({ description: '每日班次上限' })
  @IsOptional()
  @IsNumber()
  maxDailyShift?: number;

  @ApiPropertyOptional({ description: '連續工作天數上限' })
  @IsOptional()
  @IsNumber()
  maxConsecutiveDays?: number;

  @ApiPropertyOptional({ description: '角色', example: 'staff' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: '關聯院區 ID 列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hospitalIds?: string[];
}
