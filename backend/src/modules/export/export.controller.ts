import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('報表匯出')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('excel')
  @ApiOperation({ summary: '匯出 Excel' })
  async exportExcel(
    @Query('hospitalId') hospitalId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'weekly' | 'monthly' = 'weekly',
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportToExcel({
      hospitalId,
      startDate,
      endDate,
      format,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=schedule_${startDate}_${endDate}.xlsx`,
    );
    res.send(buffer);
  }

  @Get('pdf')
  @ApiOperation({ summary: '匯出 PDF' })
  async exportPdf(
    @Query('hospitalId') hospitalId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'weekly' | 'monthly' = 'weekly',
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.exportToPdf({
      hospitalId,
      startDate,
      endDate,
      format,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=schedule_${startDate}_${endDate}.pdf`,
    );
    res.send(buffer);
  }
}
