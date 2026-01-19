import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('認證')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '登入' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取得個人資料' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密碼' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, dto.oldPassword, dto.newPassword);
  }
}
