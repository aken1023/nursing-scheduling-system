import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CrossHospitalService } from './cross-hospital.service';
import { CreateCrossHospitalDto } from './dto/create-cross-hospital.dto';
import { QueryCrossHospitalDto } from './dto/query-cross-hospital.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('跨院調度')
@Controller('cross-hospital')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CrossHospitalController {
  constructor(private readonly service: CrossHospitalService) {}

  @Post()
  @ApiOperation({ summary: '發起跨院調度申請' })
  @Roles(Role.LEADER)
  create(@Body() dto: CreateCrossHospitalDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: '取得調度申請列表' })
  @Roles(Role.LEADER)
  findAll(@Query() query: QueryCrossHospitalDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.findAll(query, user);
  }

  @Get('staffing-summary')
  @ApiOperation({ summary: '取得各院區人力狀態' })
  @Roles(Role.LEADER)
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
  @Roles(Role.MANAGER)
  approve(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.approve(id, user.sub);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: '駁回調度申請' })
  @Roles(Role.MANAGER)
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.reject(id, user.sub, reason);
  }
}
