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
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { MonitorService } from './monitor.service';
import { TemplatesService } from './templates.service';
import { SwapService } from './swap.service';
import { AutoScheduleService } from './auto-schedule.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { BatchUpdateShiftDto } from './dto/batch-update-shift.dto';
import { CreateTemplateDto, UpdateTemplateDto, ApplyTemplateDto, QueryTemplateDto } from './dto/template.dto';
import { CreateSwapDto, RejectSwapDto, QuerySwapDto } from './dto/swap.dto';
import { AutoScheduleDto } from './dto/auto-schedule.dto';
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
    private readonly templatesService: TemplatesService,
    private readonly swapService: SwapService,
    private readonly autoScheduleService: AutoScheduleService,
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

  // ==================== 班表範本 ====================

  @Get('templates')
  @ApiOperation({ summary: '取得範本列表' })
  getTemplates(@Query() query: QueryTemplateDto) {
    return this.templatesService.findAll(query);
  }

  @Post('templates')
  @ApiOperation({ summary: '建立範本' })
  createTemplate(@Body() dto: CreateTemplateDto, @Request() req: any) {
    return this.templatesService.create(dto, req.user.sub);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '取得範本詳情' })
  getTemplate(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: '更新範本' })
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: '刪除範本' })
  deleteTemplate(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post('templates/:id/apply')
  @ApiOperation({ summary: '套用範本' })
  applyTemplate(
    @Param('id') id: string,
    @Body() dto: ApplyTemplateDto,
    @Request() req: any,
  ) {
    return this.templatesService.applyTemplate(id, dto, req.user.sub);
  }

  // ==================== 換班申請 ====================

  @Get('swaps')
  @ApiOperation({ summary: '取得換班申請列表' })
  getSwaps(@Query() query: QuerySwapDto) {
    return this.swapService.findAll(query);
  }

  @Post('swaps')
  @ApiOperation({ summary: '提出換班申請' })
  createSwap(@Body() dto: CreateSwapDto, @Request() req: any) {
    return this.swapService.create(req.user.sub, dto);
  }

  @Get('swaps/:id')
  @ApiOperation({ summary: '取得換班申請詳情' })
  getSwap(@Param('id') id: string) {
    return this.swapService.findOne(id);
  }

  @Post('swaps/:id/approve')
  @ApiOperation({ summary: '核准換班申請' })
  approveSwap(@Param('id') id: string, @Request() req: any) {
    return this.swapService.approve(id, req.user.sub);
  }

  @Post('swaps/:id/reject')
  @ApiOperation({ summary: '駁回換班申請' })
  rejectSwap(
    @Param('id') id: string,
    @Body() dto: RejectSwapDto,
    @Request() req: any,
  ) {
    return this.swapService.reject(id, req.user.sub, dto);
  }

  @Post('swaps/:id/cancel')
  @ApiOperation({ summary: '取消換班申請' })
  cancelSwap(@Param('id') id: string, @Request() req: any) {
    return this.swapService.cancel(id, req.user.sub);
  }

  @Get(':assignmentId/swappable')
  @ApiOperation({ summary: '取得可交換的班別' })
  getSwappableShifts(
    @Param('assignmentId') assignmentId: string,
    @Request() req: any,
  ) {
    return this.swapService.getSwappableShifts(req.user.sub, assignmentId);
  }

  // ==================== 自動排班 ====================

  @Post('auto-schedule/preview')
  @ApiOperation({ summary: '預覽自動排班結果' })
  previewAutoSchedule(@Body() dto: AutoScheduleDto, @Request() req: any) {
    return this.autoScheduleService.preview(dto, req.user.sub);
  }

  @Post('auto-schedule/execute')
  @ApiOperation({ summary: '執行自動排班' })
  executeAutoSchedule(@Body() dto: AutoScheduleDto, @Request() req: any) {
    return this.autoScheduleService.execute(dto, req.user.sub);
  }

  @Get('auto-schedule/runs')
  @ApiOperation({ summary: '取得排班執行記錄' })
  getAutoScheduleRuns(@Query('hospitalId') hospitalId?: string) {
    return this.autoScheduleService.findAllRuns(hospitalId);
  }

  @Get('auto-schedule/runs/:id')
  @ApiOperation({ summary: '取得排班執行詳情' })
  getAutoScheduleRun(@Param('id') id: string) {
    return this.autoScheduleService.findOneRun(id);
  }
}
