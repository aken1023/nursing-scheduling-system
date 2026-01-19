import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { MonitorService } from './monitor.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { BatchUpdateShiftDto } from './dto/batch-update-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShiftType } from '../../entities/shift-requirement.entity';

@ApiTags('班表管理')
@Controller('shifts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShiftsController {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly monitorService: MonitorService,
  ) {}

  @Post()
  @ApiOperation({ summary: '新增排班' })
  create(@Body() dto: CreateShiftDto, @Request() req: any) {
    return this.shiftsService.create(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: '取得班表' })
  findAll(@Query() query: QueryShiftDto) {
    return this.shiftsService.findAll(query);
  }

  @Get('summary/:hospitalId/:date')
  @ApiOperation({ summary: '取得某日班表摘要' })
  getDailySummary(
    @Param('hospitalId') hospitalId: string,
    @Param('date') date: string,
  ) {
    return this.shiftsService.getDailySummary(hospitalId, date);
  }

  @Get('available-employees')
  @ApiOperation({ summary: '取得可用人員' })
  getAvailableEmployees(
    @Query('hospitalId') hospitalId: string,
    @Query('date') date: string,
    @Query('shiftType') shiftType: ShiftType,
  ) {
    return this.shiftsService.getAvailableEmployees(hospitalId, date, shiftType);
  }

  @Get('logs')
  @ApiOperation({ summary: '取得調整日誌' })
  getLogs(
    @Query('assignmentId') assignmentId?: string,
    @Query('date') date?: string,
  ) {
    return this.shiftsService.getAdjustmentLogs(assignmentId, date);
  }

  @Get('monitor/dashboard')
  @ApiOperation({ summary: '取得監控儀表板資料' })
  getDashboard(@Query('hospitalId') hospitalId?: string) {
    return this.monitorService.getDashboardData(hospitalId);
  }

  @Get('monitor/leader-gaps')
  @ApiOperation({ summary: '取得 Leader 缺口' })
  getLeaderGaps(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.monitorService.checkLeaderGaps(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '取得排班詳情' })
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新排班' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @Request() req: any,
  ) {
    return this.shiftsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除排班' })
  remove(
    @Param('id') id: string,
    @Query('reason') reason: string,
    @Request() req: any,
  ) {
    return this.shiftsService.remove(id, req.user.sub, reason);
  }

  @Post('batch')
  @ApiOperation({ summary: '批次調整班表' })
  batchUpdate(@Body() dto: BatchUpdateShiftDto, @Request() req: any) {
    return this.shiftsService.batchUpdate(dto, req.user.sub);
  }
}
