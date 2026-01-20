import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { CreateShiftRequirementDto } from './dto/create-shift-requirement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('院區管理')
@Controller('hospitals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Post()
  @ApiOperation({ summary: '新增院區' })
  @Roles(Role.ADMIN)
  create(@Body() createHospitalDto: CreateHospitalDto) {
    return this.hospitalsService.create(createHospitalDto);
  }

  @Get()
  @ApiOperation({ summary: '取得院區列表' })
  findAll() {
    return this.hospitalsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '取得院區詳情' })
  findOne(@Param('id') id: string) {
    return this.hospitalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新院區' })
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateHospitalDto: UpdateHospitalDto) {
    return this.hospitalsService.update(id, updateHospitalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除院區' })
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.hospitalsService.remove(id);
  }

  // 班別需求
  @Post(':id/shift-requirements')
  @ApiOperation({ summary: '新增班別需求' })
  @Roles(Role.MANAGER)
  createShiftRequirement(
    @Param('id') hospitalId: string,
    @Body() dto: CreateShiftRequirementDto,
  ) {
    return this.hospitalsService.createShiftRequirement({ ...dto, hospitalId });
  }

  @Get(':id/shift-requirements')
  @ApiOperation({ summary: '取得班別需求列表' })
  getShiftRequirements(
    @Param('id') hospitalId: string,
    @Query('date') date?: string,
  ) {
    return this.hospitalsService.getShiftRequirements(
      hospitalId,
      date ? new Date(date) : undefined,
    );
  }
}
