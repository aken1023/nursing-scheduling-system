import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hospital } from '../../entities/hospital.entity';
import { ShiftRequirement } from '../../entities/shift-requirement.entity';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { CreateShiftRequirementDto } from './dto/create-shift-requirement.dto';

@Injectable()
export class HospitalsService {
  constructor(
    @InjectRepository(Hospital)
    private hospitalRepository: Repository<Hospital>,
    @InjectRepository(ShiftRequirement)
    private shiftRequirementRepository: Repository<ShiftRequirement>,
  ) {}

  async create(createHospitalDto: CreateHospitalDto): Promise<Hospital> {
    const existing = await this.hospitalRepository.findOne({
      where: { code: createHospitalDto.code },
    });
    if (existing) {
      throw new ConflictException('院區代碼已存在');
    }

    const hospital = this.hospitalRepository.create(createHospitalDto);
    return this.hospitalRepository.save(hospital);
  }

  async findAll(): Promise<Hospital[]> {
    return this.hospitalRepository.find({
      order: { code: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Hospital> {
    const hospital = await this.hospitalRepository.findOne({
      where: { id },
      relations: ['shiftRequirements'],
    });
    if (!hospital) {
      throw new NotFoundException('院區不存在');
    }
    return hospital;
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto): Promise<Hospital> {
    const hospital = await this.findOne(id);
    Object.assign(hospital, updateHospitalDto);
    return this.hospitalRepository.save(hospital);
  }

  async remove(id: string): Promise<void> {
    const hospital = await this.findOne(id);
    await this.hospitalRepository.remove(hospital);
  }

  // 班別需求管理
  async createShiftRequirement(dto: CreateShiftRequirementDto): Promise<ShiftRequirement> {
    const requirement = this.shiftRequirementRepository.create(dto);
    return this.shiftRequirementRepository.save(requirement);
  }

  async getShiftRequirements(hospitalId: string, date?: Date): Promise<ShiftRequirement[]> {
    const queryBuilder = this.shiftRequirementRepository
      .createQueryBuilder('req')
      .where('req.hospitalId = :hospitalId', { hospitalId });

    if (date) {
      queryBuilder.andWhere('req.effectiveDate <= :date', { date });
    }

    return queryBuilder
      .orderBy('req.effectiveDate', 'DESC')
      .getMany();
  }

  async updateShiftRequirement(id: string, dto: Partial<CreateShiftRequirementDto>): Promise<ShiftRequirement> {
    const requirement = await this.shiftRequirementRepository.findOne({ where: { id } });
    if (!requirement) {
      throw new NotFoundException('班別需求不存在');
    }
    Object.assign(requirement, dto);
    return this.shiftRequirementRepository.save(requirement);
  }
}
