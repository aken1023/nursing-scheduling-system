import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CrossHospitalService } from './cross-hospital.service';
import { CreateCrossHospitalDto } from './dto/create-cross-hospital.dto';
import { QueryCrossHospitalDto } from './dto/query-cross-hospital.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('跨院調度')
@Controller('cross-hospital')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrossHospitalController {
  constructor(private readonly service: CrossHospitalService) {}

  @Post()
  @ApiOperation({ summary: '發起跨院調度申請' })
  create(@Body() dto: CreateCrossHospitalDto, @Request() req: any) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: '取得調度申請列表' })
  findAll(@Query() query: QueryCrossHospitalDto) {
    return this.service.findAll(query);
  }

  @Get('staffing-summary')
  @ApiOperation({ summary: '取得各院區人力狀態' })
  getStaffingSummary(
    @Query('date') date: string,
    @Query('shiftType') shiftType: string,
  ) {
    return this.service.getHospitalStaffingSummary(date, shiftType);
  }

  @Get(':id')
  @ApiOperation({ summary: '取得調度申請詳情' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: '核准調度申請' })
  approve(@Param('id') id: string, @Request() req: any) {
    return this.service.approve(id, req.user.sub);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: '駁回調度申請' })
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    return this.service.reject(id, req.user.sub, reason);
  }
}
