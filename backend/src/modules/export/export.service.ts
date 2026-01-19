import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { ShiftAssignment, AssignmentStatus } from '../../entities/shift-assignment.entity';
import { Employee } from '../../entities/employee.entity';
import { Hospital } from '../../entities/hospital.entity';
import { ShiftType } from '../../entities/shift-requirement.entity';

export interface ExportOptions {
  hospitalId: string;
  startDate: string;
  endDate: string;
  format: 'weekly' | 'monthly';
}

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(ShiftAssignment)
    private shiftRepository: Repository<ShiftAssignment>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Hospital)
    private hospitalRepository: Repository<Hospital>,
  ) {}

  async exportToExcel(options: ExportOptions): Promise<Buffer> {
    const { hospitalId, startDate, endDate } = options;

    const hospital = await this.hospitalRepository.findOne({ where: { id: hospitalId } });
    const shifts = await this.shiftRepository.find({
      where: {
        hospitalId,
        date: Between(new Date(startDate), new Date(endDate)),
        status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED, AssignmentStatus.COMPLETED]),
      },
      relations: ['employee'],
      order: { date: 'ASC', shiftType: 'ASC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('班表');

    // 設定標題
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `${hospital?.name || ''} 班表 (${startDate} ~ ${endDate})`;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };

    // 設定欄位標題
    worksheet.getRow(3).values = ['日期', '星期', '白班', '白班人數', '小夜', '小夜人數', '大夜', '大夜人數'];
    worksheet.getRow(3).font = { bold: true };
    worksheet.getRow(3).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // 設定欄寬
    worksheet.columns = [
      { width: 12 },
      { width: 8 },
      { width: 25 },
      { width: 10 },
      { width: 25 },
      { width: 10 },
      { width: 25 },
      { width: 10 },
    ];

    // 依日期分組
    const groupedByDate = this.groupShiftsByDate(shifts);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    let rowIndex = 4;
    for (const [dateStr, dateShifts] of Object.entries(groupedByDate)) {
      const date = new Date(dateStr);
      const dayShifts = dateShifts.filter((s) => s.shiftType === ShiftType.DAY);
      const eveningShifts = dateShifts.filter((s) => s.shiftType === ShiftType.EVENING);
      const nightShifts = dateShifts.filter((s) => s.shiftType === ShiftType.NIGHT);

      const row = worksheet.getRow(rowIndex);
      row.values = [
        dateStr,
        weekdays[date.getDay()],
        this.formatEmployeeNames(dayShifts),
        dayShifts.length,
        this.formatEmployeeNames(eveningShifts),
        eveningShifts.length,
        this.formatEmployeeNames(nightShifts),
        nightShifts.length,
      ];

      // 週末標示
      if (date.getDay() === 0 || date.getDay() === 6) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF0E0' },
        };
      }

      rowIndex++;
    }

    // 加入統計
    rowIndex += 2;
    worksheet.getRow(rowIndex).values = ['統計'];
    worksheet.getRow(rowIndex).font = { bold: true };
    rowIndex++;

    // 員工工時統計
    const employeeHours = this.calculateEmployeeHours(shifts);
    worksheet.getRow(rowIndex).values = ['工號', '姓名', '白班次數', '小夜次數', '大夜次數', '總班次'];
    worksheet.getRow(rowIndex).font = { bold: true };
    rowIndex++;

    for (const [empId, stats] of Object.entries(employeeHours)) {
      worksheet.getRow(rowIndex).values = [
        stats.employeeNo,
        stats.name,
        stats.dayCount,
        stats.eveningCount,
        stats.nightCount,
        stats.total,
      ];
      rowIndex++;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportToPdf(options: ExportOptions): Promise<Buffer> {
    // PDF 匯出可以使用 pdfkit 或其他套件
    // 這裡先返回空的 buffer，實際實作需要安裝 pdfkit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    return new Promise((resolve) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text(`班表報表`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`期間: ${options.startDate} ~ ${options.endDate}`);
      doc.moveDown();
      doc.text('(PDF 詳細內容需要進一步實作)');

      doc.end();
    });
  }

  private groupShiftsByDate(shifts: ShiftAssignment[]): Record<string, ShiftAssignment[]> {
    return shifts.reduce((acc, shift) => {
      const dateStr = shift.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(shift);
      return acc;
    }, {} as Record<string, ShiftAssignment[]>);
  }

  private formatEmployeeNames(shifts: ShiftAssignment[]): string {
    return shifts
      .map((s) => {
        const name = s.employee?.name || '';
        return s.isLeaderDuty ? `${name}(L)` : name;
      })
      .join(', ');
  }

  private calculateEmployeeHours(shifts: ShiftAssignment[]): Record<
    string,
    {
      employeeNo: string;
      name: string;
      dayCount: number;
      eveningCount: number;
      nightCount: number;
      total: number;
    }
  > {
    const stats: Record<string, any> = {};

    for (const shift of shifts) {
      const empId = shift.employeeId;
      if (!stats[empId]) {
        stats[empId] = {
          employeeNo: shift.employee?.employeeNo || '',
          name: shift.employee?.name || '',
          dayCount: 0,
          eveningCount: 0,
          nightCount: 0,
          total: 0,
        };
      }

      if (shift.shiftType === ShiftType.DAY) stats[empId].dayCount++;
      else if (shift.shiftType === ShiftType.EVENING) stats[empId].eveningCount++;
      else if (shift.shiftType === ShiftType.NIGHT) stats[empId].nightCount++;

      stats[empId].total++;
    }

    return stats;
  }
}
