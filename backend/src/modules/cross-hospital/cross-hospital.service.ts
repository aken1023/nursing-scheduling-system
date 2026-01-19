import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CrossHospitalRequest, CrossHospitalStatus } from '../../entities/cross-hospital-request.entity';
import { ShiftAssignment, AssignmentStatus } from '../../entities/shift-assignment.entity';
import { Employee, EmployeeStatus } from '../../entities/employee.entity';
import { Hospital } from '../../entities/hospital.entity';
import { ShiftRequirement } from '../../entities/shift-requirement.entity';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from '../../entities/notification.entity';
import { CreateCrossHospitalDto } from './dto/create-cross-hospital.dto';
import { QueryCrossHospitalDto } from './dto/query-cross-hospital.dto';

@Injectable()
export class CrossHospitalService {
  constructor(
    @InjectRepository(CrossHospitalRequest)
    private requestRepository: Repository<CrossHospitalRequest>,
    @InjectRepository(ShiftAssignment)
    private shiftRepository: Repository<ShiftAssignment>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Hospital)
    private hospitalRepository: Repository<Hospital>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(dto: CreateCrossHospitalDto, requesterId: string): Promise<CrossHospitalRequest> {
    // 檢查是否已有相同的調度申請
    const existing = await this.requestRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        toHospitalId: dto.toHospitalId,
        date: new Date(dto.date),
        shiftType: dto.shiftType,
        status: In([CrossHospitalStatus.PENDING, CrossHospitalStatus.APPROVED]),
      },
    });
    if (existing) {
      throw new BadRequestException('已有相同的調度申請');
    }

    const request = this.requestRepository.create({
      ...dto,
      date: new Date(dto.date),
      requestedBy: requesterId,
    });

    const saved = await this.requestRepository.save(request);

    // 通知原院區主管
    await this.notifyManagers(saved, '跨院調度申請', `有新的跨院調度申請需要您審核`);

    return saved;
  }

  async findAll(query: QueryCrossHospitalDto) {
    const { page = 1, limit = 20, status, fromHospitalId, toHospitalId, date } = query;

    const queryBuilder = this.requestRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.employee', 'employee')
      .leftJoinAndSelect('req.fromHospital', 'fromHospital')
      .leftJoinAndSelect('req.toHospital', 'toHospital')
      .leftJoinAndSelect('req.requester', 'requester');

    if (status) {
      queryBuilder.andWhere('req.status = :status', { status });
    }

    if (fromHospitalId) {
      queryBuilder.andWhere('req.fromHospitalId = :fromHospitalId', { fromHospitalId });
    }

    if (toHospitalId) {
      queryBuilder.andWhere('req.toHospitalId = :toHospitalId', { toHospitalId });
    }

    if (date) {
      queryBuilder.andWhere('req.date = :date', { date });
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('req.createdAt', 'DESC')
      .getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<CrossHospitalRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['employee', 'fromHospital', 'toHospital', 'requester', 'approver'],
    });
    if (!request) {
      throw new NotFoundException('調度申請不存在');
    }
    return request;
  }

  async approve(id: string, approverId: string): Promise<CrossHospitalRequest> {
    const request = await this.findOne(id);

    if (request.status !== CrossHospitalStatus.PENDING) {
      throw new BadRequestException('此申請已處理');
    }

    request.status = CrossHospitalStatus.APPROVED;
    request.approvedBy = approverId;

    const saved = await this.requestRepository.save(request);

    // 建立跨院排班記錄
    await this.createCrossHospitalShift(request);

    // 通知相關人員
    await this.sendNotification(
      request.employeeId,
      NotificationType.CROSS_HOSPITAL_REQUEST,
      '跨院調度已核准',
      `您已被調度至 ${request.toHospital?.name || ''} 支援 ${request.date.toISOString().split('T')[0]} ${request.shiftType} 班`,
    );

    return saved;
  }

  async reject(id: string, approverId: string, reason: string): Promise<CrossHospitalRequest> {
    const request = await this.findOne(id);

    if (request.status !== CrossHospitalStatus.PENDING) {
      throw new BadRequestException('此申請已處理');
    }

    request.status = CrossHospitalStatus.REJECTED;
    request.approvedBy = approverId;
    request.reason = reason;

    const saved = await this.requestRepository.save(request);

    // 通知申請人
    await this.sendNotification(
      request.requestedBy,
      NotificationType.CROSS_HOSPITAL_REQUEST,
      '跨院調度已駁回',
      `跨院調度申請已被駁回。原因: ${reason}`,
    );

    return saved;
  }

  // 取得各院區人力狀態
  async getHospitalStaffingSummary(date: string, shiftType: string) {
    const hospitals = await this.hospitalRepository.find();
    const summary = [];

    for (const hospital of hospitals) {
      const shifts = await this.shiftRepository.count({
        where: {
          hospitalId: hospital.id,
          date: new Date(date),
          shiftType: shiftType as any,
          status: In([AssignmentStatus.SCHEDULED, AssignmentStatus.CONFIRMED]),
        },
      });

      // 取得可支援的員工
      const availableStaff = await this.employeeRepository
        .createQueryBuilder('emp')
        .leftJoin('emp.hospitals', 'hospital')
        .leftJoin(
          ShiftAssignment,
          'shift',
          'shift.employeeId = emp.id AND shift.date = :date',
          { date },
        )
        .where('hospital.id = :hospitalId', { hospitalId: hospital.id })
        .andWhere('emp.status = :status', { status: 'active' })
        .andWhere('shift.id IS NULL')
        .getMany();

      summary.push({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        required: 3, // 從 requirement 取得
        assigned: shifts,
        availableCount: availableStaff.length,
        availableStaff: availableStaff.map((e) => ({ id: e.id, name: e.name })),
      });
    }

    return summary;
  }

  private async createCrossHospitalShift(request: CrossHospitalRequest) {
    const shift = this.shiftRepository.create({
      date: request.date,
      hospitalId: request.toHospitalId,
      shiftType: request.shiftType,
      employeeId: request.employeeId,
      isCrossHospital: true,
      sourceHospitalId: request.fromHospitalId,
      status: AssignmentStatus.SCHEDULED,
      createdBy: request.approvedBy,
    });
    await this.shiftRepository.save(shift);
  }

  private async notifyManagers(request: CrossHospitalRequest, title: string, content: string) {
    const managers = await this.employeeRepository.find({
      where: { role: In(['admin', 'manager']), status: EmployeeStatus.ACTIVE },
    });

    for (const manager of managers) {
      await this.sendNotification(manager.id, NotificationType.CROSS_HOSPITAL_REQUEST, title, content);
    }
  }

  private async sendNotification(
    recipientId: string,
    type: NotificationType,
    title: string,
    content: string,
  ) {
    const notification = this.notificationRepository.create({
      type,
      recipientId,
      channel: NotificationChannel.SYSTEM,
      title,
      content,
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });
    await this.notificationRepository.save(notification);
  }
}
