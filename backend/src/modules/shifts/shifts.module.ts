import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';
import { MonitorService } from './monitor.service';
import { TemplatesService } from './templates.service';
import { SwapService } from './swap.service';
import { AutoScheduleService } from './auto-schedule.service';
import { ShiftAssignment } from '../../entities/shift-assignment.entity';
import { ShiftAdjustmentLog } from '../../entities/shift-adjustment-log.entity';
import { ShiftRequirement } from '../../entities/shift-requirement.entity';
import { Employee } from '../../entities/employee.entity';
import { LeaveRequest } from '../../entities/leave-request.entity';
import { ShiftTemplate } from '../../entities/shift-template.entity';
import { ShiftTemplateItem } from '../../entities/shift-template-item.entity';
import { ShiftSwapRequest } from '../../entities/shift-swap-request.entity';
import { AutoScheduleRun } from '../../entities/auto-schedule-run.entity';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShiftAssignment,
      ShiftAdjustmentLog,
      ShiftRequirement,
      Employee,
      LeaveRequest,
      ShiftTemplate,
      ShiftTemplateItem,
      ShiftSwapRequest,
      AutoScheduleRun,
    ]),
    forwardRef(() => EmployeesModule),
  ],
  controllers: [ShiftsController],
  providers: [
    ShiftsService,
    MonitorService,
    TemplatesService,
    SwapService,
    AutoScheduleService,
  ],
  exports: [ShiftsService, MonitorService, TemplatesService, SwapService, AutoScheduleService],
})
export class ShiftsModule {}
