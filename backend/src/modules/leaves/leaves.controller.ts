import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { QueryLeaveDto } from './dto/query-leave.dto';
import { RejectLeaveDto } from './dto/reject-leave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('請假管理')
@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  @ApiOperation({ summary: '提交請假申請' })
  create(@Body() dto: CreateLeaveDto, @CurrentUser() user: CurrentUserPayload) {
    return this.leavesService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: '取得請假列表' })
  findAll(@Query() query: QueryLeaveDto, @CurrentUser() user: CurrentUserPayload) {
    return this.leavesService.findAll(query, user);
  }

  @Get('pending-count')
  @ApiOperation({ summary: '取得待審核數量' })
  @Roles(Role.LEADER)
  getPendingCount(@CurrentUser() user: CurrentUserPayload) {
    return this.leavesService.getPendingCount(user);
  }

  @Get(':id')
  @ApiOperation({ summary: '取得請假詳情' })
  findOne(@Param('id') id: string) {
    return this.leavesService.findOne(id);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: '核准請假' })
  @Roles(Role.LEADER)
  approve(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.leavesService.approve(id, user.sub);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: '駁回請假' })
  @Roles(Role.LEADER)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectLeaveDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.leavesService.reject(id, user.sub, dto.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: '取消請假申請' })
  cancel(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.leavesService.cancel(id, user.sub);
  }
}
