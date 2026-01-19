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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('員工管理')
@Controller('employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: '新增員工' })
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
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除員工' })
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: '重設員工密碼' })
  resetPassword(@Param('id') id: string) {
    return this.employeesService.resetPassword(id);
  }
}
