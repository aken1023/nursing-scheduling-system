import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftSwapRequest, SwapStatus } from '../../entities/shift-swap-request.entity';
import { ShiftAssignment, AssignmentStatus } from '../../entities/shift-assignment.entity';
import { ShiftAdjustmentLog, AdjustmentAction } from '../../entities/shift-adjustment-log.entity';
import { CreateSwapDto, RejectSwapDto, QuerySwapDto } from './dto/swap.dto';

@Injectable()
export class SwapService {
  constructor(
    @InjectRepository(ShiftSwapRequest)
    private swapRepository: Repository<ShiftSwapRequest>,
    @InjectRepository(ShiftAssignment)
    private assignmentRepository: Repository<ShiftAssignment>,
    @InjectRepository(ShiftAdjustmentLog)
    private logRepository: Repository<ShiftAdjustmentLog>,
  ) {}

  async findAll(query: QuerySwapDto): Promise<ShiftSwapRequest[]> {
    const where: any = {};
    if (query.requesterId) where.requesterId = query.requesterId;
    if (query.targetId) where.targetId = query.targetId;
    if (query.status) where.status = query.status;

    return this.swapRepository.find({
      where,
      relations: [
        'requester',
        'target',
        'requesterAssignment',
        'requesterAssignment.hospital',
        'targetAssignment',
        'targetAssignment.hospital',
        'approver',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ShiftSwapRequest> {
    const swap = await this.swapRepository.findOne({
      where: { id },
      relations: [
        'requester',
        'target',
        'requesterAssignment',
        'requesterAssignment.hospital',
        'targetAssignment',
        'targetAssignment.hospital',
        'approver',
      ],
    });

    if (!swap) {
      throw new NotFoundException('換班申請不存在');
    }

    return swap;
  }

  async create(requesterId: string, dto: CreateSwapDto): Promise<ShiftSwapRequest> {
    // 驗證申請人的班別
    const requesterAssignment = await this.assignmentRepository.findOne({
      where: { id: dto.requesterAssignmentId },
    });

    if (!requesterAssignment) {
      throw new BadRequestException('申請人的班別不存在');
    }

    if (requesterAssignment.employeeId !== requesterId) {
      throw new BadRequestException('只能申請交換自己的班別');
    }

    // 驗證交換對象的班別
    const targetAssignment = await this.assignmentRepository.findOne({
      where: { id: dto.targetAssignmentId },
    });

    if (!targetAssignment) {
      throw new BadRequestException('交換對象的班別不存在');
    }

    if (targetAssignment.employeeId !== dto.targetId) {
      throw new BadRequestException('交換對象的班別不屬於指定員工');
    }

    // 檢查是否有重複的待處理申請
    const existingPending = await this.swapRepository.findOne({
      where: {
        requesterId,
        requesterAssignmentId: dto.requesterAssignmentId,
        status: SwapStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new BadRequestException('已有相同的待處理換班申請');
    }

    const swap = this.swapRepository.create({
      requesterId,
      requesterAssignmentId: dto.requesterAssignmentId,
      targetId: dto.targetId,
      targetAssignmentId: dto.targetAssignmentId,
      reason: dto.reason,
    });

    return this.swapRepository.save(swap);
  }

  async approve(id: string, approverId: string): Promise<ShiftSwapRequest> {
    const swap = await this.findOne(id);

    if (swap.status !== SwapStatus.PENDING) {
      throw new BadRequestException('只能核准待處理的申請');
    }

    // 取得兩個班別
    const requesterAssignment = await this.assignmentRepository.findOne({
      where: { id: swap.requesterAssignmentId },
    });
    const targetAssignment = await this.assignmentRepository.findOne({
      where: { id: swap.targetAssignmentId },
    });

    if (!requesterAssignment || !targetAssignment) {
      throw new BadRequestException('班別已被刪除，無法執行換班');
    }

    // 交換員工
    const tempEmployeeId = requesterAssignment.employeeId;
    const tempIsLeader = requesterAssignment.isLeaderDuty;

    requesterAssignment.employeeId = targetAssignment.employeeId;
    requesterAssignment.isLeaderDuty = targetAssignment.isLeaderDuty;

    targetAssignment.employeeId = tempEmployeeId;
    targetAssignment.isLeaderDuty = tempIsLeader;

    await this.assignmentRepository.save([requesterAssignment, targetAssignment]);

    // 記錄換班日誌
    const logRequester = this.logRepository.create({
      assignmentId: requesterAssignment.id,
      action: AdjustmentAction.SWAP,
      oldValue: { employeeId: tempEmployeeId },
      newValue: { employeeId: requesterAssignment.employeeId },
      reason: `與 ${swap.target.name} 換班`,
      operatedBy: approverId,
    });

    const logTarget = this.logRepository.create({
      assignmentId: targetAssignment.id,
      action: AdjustmentAction.SWAP,
      oldValue: { employeeId: requesterAssignment.employeeId },
      newValue: { employeeId: tempEmployeeId },
      reason: `與 ${swap.requester.name} 換班`,
      operatedBy: approverId,
    });

    await this.logRepository.save([logRequester, logTarget]);

    // 更新申請狀態
    swap.status = SwapStatus.APPROVED;
    swap.approvedBy = approverId;

    return this.swapRepository.save(swap);
  }

  async reject(id: string, approverId: string, dto: RejectSwapDto): Promise<ShiftSwapRequest> {
    const swap = await this.findOne(id);

    if (swap.status !== SwapStatus.PENDING) {
      throw new BadRequestException('只能駁回待處理的申請');
    }

    swap.status = SwapStatus.REJECTED;
    swap.approvedBy = approverId;
    swap.rejectReason = dto.rejectReason;

    return this.swapRepository.save(swap);
  }

  async cancel(id: string, requesterId: string): Promise<ShiftSwapRequest> {
    const swap = await this.findOne(id);

    if (swap.requesterId !== requesterId) {
      throw new BadRequestException('只能取消自己的申請');
    }

    if (swap.status !== SwapStatus.PENDING) {
      throw new BadRequestException('只能取消待處理的申請');
    }

    swap.status = SwapStatus.CANCELLED;

    return this.swapRepository.save(swap);
  }

  // 取得員工可交換的班別
  async getSwappableShifts(
    employeeId: string,
    assignmentId: string,
  ): Promise<ShiftAssignment[]> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('班別不存在');
    }

    // 取得同一院區、同一班別類型、未來 7 天內的其他員工班別
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    return this.assignmentRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.employee', 'employee')
      .leftJoinAndSelect('shift.hospital', 'hospital')
      .where('shift.hospital_id = :hospitalId', { hospitalId: assignment.hospitalId })
      .andWhere('shift.shift_type = :shiftType', { shiftType: assignment.shiftType })
      .andWhere('shift.employee_id != :employeeId', { employeeId })
      .andWhere('shift.date >= :today', { today: new Date() })
      .andWhere('shift.date <= :futureDate', { futureDate })
      .andWhere('shift.status IN (:...statuses)', {
        statuses: [AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED],
      })
      .orderBy('shift.date', 'ASC')
      .getMany();
  }
}
