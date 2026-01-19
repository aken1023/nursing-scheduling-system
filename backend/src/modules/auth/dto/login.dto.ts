import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: '員工工號', example: 'A001' })
  @IsNotEmpty({ message: '工號不能為空' })
  @IsString()
  employeeNo: string;

  @ApiProperty({ description: '密碼', example: 'password123' })
  @IsNotEmpty({ message: '密碼不能為空' })
  @IsString()
  password: string;
}
