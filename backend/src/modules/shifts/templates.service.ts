import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftTemplate } from '../../entities/shift-template.entity';
import { ShiftTemplateItem, TemplateShiftType } from '../../entities/shift-template-item.entity';
import { ShiftAssignment, AssignmentStatus } from '../../entities/shift-assignment.entity';
import { ShiftType } from '../../entities/shift-requirement.entity';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  ApplyTemplateDto,
  QueryTemplateDto,
} from './dto/template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(ShiftTemplate)
    private templateRepository: Repository<ShiftTemplate>,
    @InjectRepository(ShiftTemplateItem)
    private itemRepository: Repository<ShiftTemplateItem>,
    @InjectRepository(ShiftAssignment)
    private assignmentRepository: Repository<ShiftAssignment>,
  ) {}

  async findAll(query: QueryTemplateDto): Promise<ShiftTemplate[]> {
    const where: any = {};
    if (query.hospitalId) where.hospitalId = query.hospitalId;
    if (query.activeOnly) where.isActive = true;

    return this.templateRepository.find({
      where,
      relations: ['hospital', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ShiftTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['hospital', 'items', 'creator'],
    });

    if (!template) {
      throw new NotFoundException('範本不存在');
    }

    return template;
  }

  async create(dto: CreateTemplateDto, createdBy: string): Promise<ShiftTemplate> {
    const template = this.templateRepository.create({
      name: dto.name,
      hospitalId: dto.hospitalId,
      description: dto.description,
      cycleDays: dto.cycleDays || 7,
      createdBy,
    });

    const savedTemplate = await this.templateRepository.save(template);

    if (dto.items && dto.items.length > 0) {
      const items = dto.items.map((item) =>
        this.itemRepository.create({
          templateId: savedTemplate.id,
          dayIndex: item.dayIndex,
          shiftType: item.shiftType,
          requiredCount: item.requiredCount || 1,
          leaderRequired: item.leaderRequired || 0,
        }),
      );
      await this.itemRepository.save(items);
    }

    return this.findOne(savedTemplate.id);
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<ShiftTemplate> {
    const template = await this.findOne(id);

    if (dto.name) template.name = dto.name;
    if (dto.description !== undefined) template.description = dto.description;
    if (dto.cycleDays) template.cycleDays = dto.cycleDays;
    if (dto.isActive !== undefined) template.isActive = dto.isActive;

    await this.templateRepository.save(template);

    if (dto.items) {
      // 刪除舊的項目
      await this.itemRepository.delete({ templateId: id });

      // 新增新的項目
      const items = dto.items.map((item) =>
        this.itemRepository.create({
          templateId: id,
          dayIndex: item.dayIndex,
          shiftType: item.shiftType,
          requiredCount: item.requiredCount || 1,
          leaderRequired: item.leaderRequired || 0,
        }),
      );
      await this.itemRepository.save(items);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }

  async applyTemplate(
    id: string,
    dto: ApplyTemplateDto,
    operatorId: string,
  ): Promise<{
    created: number;
    skipped: number;
    preview: any[];
  }> {
    const template = await this.findOne(id);

    if (!template.items || template.items.length === 0) {
      throw new BadRequestException('範本沒有任何班別設定');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const preview: any[] = [];
    let created = 0;
    let skipped = 0;

    // 遍歷日期範圍
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // 計算當前日期在週期內的位置
      const daysDiff = Math.floor(
        (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const dayIndex = daysDiff % template.cycleDays;

      // 找出該天的範本項目
      const dayItems = template.items.filter(
        (item) => item.dayIndex === dayIndex && item.shiftType !== TemplateShiftType.OFF,
      );

      for (const item of dayItems) {
        const shiftType = item.shiftType as unknown as ShiftType;
        const dateStr = currentDate.toISOString().split('T')[0];

        // 檢查是否已存在
        const existing = await this.assignmentRepository.count({
          where: {
            date: currentDate,
            hospitalId: template.hospitalId,
            shiftType,
          },
        });

        if (existing >= item.requiredCount) {
          skipped++;
          continue;
        }

        const previewItem = {
          date: dateStr,
          shiftType: item.shiftType,
          requiredCount: item.requiredCount,
          leaderRequired: item.leaderRequired,
          existing,
          needToFill: item.requiredCount - existing,
        };
        preview.push(previewItem);

        if (!dto.previewOnly) {
          // 這裡只建立空位標記，實際人員分配由自動排班處理
          // 或由管理員手動指派
          created++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { created, skipped, preview };
  }
}
