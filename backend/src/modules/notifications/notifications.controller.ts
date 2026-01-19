import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('通知管理')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '取得通知列表' })
  findAll(@Request() req: any, @Query('limit') limit?: number) {
    return this.service.findByUser(req.user.sub, limit || 50);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '取得未讀通知數量' })
  getUnreadCount(@Request() req: any) {
    return this.service.getUnreadCount(req.user.sub);
  }

  @Post(':id/read')
  @ApiOperation({ summary: '標記通知為已讀' })
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.service.markAsRead(id, req.user.sub);
  }

  @Post('read-all')
  @ApiOperation({ summary: '標記全部通知為已讀' })
  markAllAsRead(@Request() req: any) {
    return this.service.markAllAsRead(req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除通知' })
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user.sub);
  }
}
