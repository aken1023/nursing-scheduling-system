import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: '原密碼' })
  @IsNotEmpty({ message: '原密碼不能為空' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: '新密碼', minLength: 6 })
  @IsNotEmpty({ message: '新密碼不能為空' })
  @IsString()
  @MinLength(6, { message: '新密碼長度至少6個字元' })
  newPassword: string;
}
