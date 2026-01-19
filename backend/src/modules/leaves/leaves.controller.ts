import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { QueryLeaveDto } from './dto/query-leave.dto';
import { RejectLeaveDto } from './dto/reject-leave.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('請假管理')
@Controller('leaves')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  @ApiOperation({ summary: '提交請假申請' })
  create(@Body() dto: CreateLeaveDto, @Request() req: any) {
    return this.leavesService.create(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: '取得請假列表' })
  findAll(@Query() query: QueryLeaveDto) {
    return this.leavesService.findAll(query);
  }

  @Get('pending-count')
  @ApiOperation({ summary: '取得待審核數量' })
  getPendingCount() {
    return this.leavesService.getPendingCount();
  }

  @Get(':id')
  @ApiOperation({ summary: '取得請假詳情' })
  findOne(@Param('id') id: string) {
    return this.leavesService.findOne(id);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: '核准請假' })
  approve(@Param('id') id: string, @Request() req: any) {
    return this.leavesService.approve(id, req.user.sub);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: '駁回請假' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectLeaveDto,
    @Request() req: any,
  ) {
    return this.leavesService.reject(id, req.user.sub, dto.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: '取消請假申請' })
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.leavesService.cancel(id, req.user.sub);
  }
}
