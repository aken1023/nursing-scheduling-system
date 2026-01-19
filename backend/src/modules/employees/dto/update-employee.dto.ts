import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeStatus } from '../../../entities/employee.entity';

export class UpdateEmployeeDto extends PartialType(
  OmitType(CreateEmployeeDto, ['employeeNo'] as const),
) {
  @ApiPropertyOptional({ description: '員工狀態', enum: EmployeeStatus })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
