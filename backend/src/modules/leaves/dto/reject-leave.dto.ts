import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectLeaveDto {
  @ApiProperty({ description: '駁回原因' })
  @IsNotEmpty({ message: '請填寫駁回原因' })
  @IsString()
  reason: string;
}
