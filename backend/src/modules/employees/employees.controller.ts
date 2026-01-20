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
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { PreferencesService } from './preferences.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { CreatePreferenceDto, UpdatePreferenceDto } from './dto/preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('員工管理')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly preferencesService: PreferencesService,
  ) {}

  @Post()
  @ApiOperation({ summary: '新增員工' })
  @Roles(Role.MANAGER)
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @ApiOperation({ summary: '取得員工列表' })
  findAll(@Query() query: QueryEmployeeDto) {
    return this.employeesService.findAll(query);
  }

  @Get('leaders')
  @ApiOperation({ summary: '取得 Leader 列表' })
  getLeaders(@Query('hospitalId') hospitalId?: string) {
    return this.employeesService.getLeaders(hospitalId);
  }

  @Get(':id')
  @ApiOperation({ summary: '取得員工詳情' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新員工資料' })
  @Roles(Role.MANAGER)
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除員工' })
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: '重設員工密碼' })
  @Roles(Role.MANAGER)
  resetPassword(@Param('id') id: string) {
    return this.employeesService.resetPassword(id);
  }

  // ==================== 員工偏好設定 ====================

  @Get(':id/preferences')
  @ApiOperation({ summary: '取得員工偏好設定' })
  getPreferences(@Param('id') id: string) {
    return this.preferencesService.findByEmployee(id);
  }

  @Post(':id/preferences')
  @ApiOperation({ summary: '新增員工偏好設定' })
  createPreference(
    @Param('id') id: string,
    @Body() dto: CreatePreferenceDto,
  ) {
    return this.preferencesService.create(id, dto);
  }

  @Put(':id/preferences/:prefId')
  @ApiOperation({ summary: '更新員工偏好設定' })
  updatePreference(
    @Param('id') id: string,
    @Param('prefId') prefId: string,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.preferencesService.update(id, prefId, dto);
  }

  @Delete(':id/preferences/:prefId')
  @ApiOperation({ summary: '刪除員工偏好設定' })
  deletePreference(
    @Param('id') id: string,
    @Param('prefId') prefId: string,
  ) {
    return this.preferencesService.remove(id, prefId);
  }
}
