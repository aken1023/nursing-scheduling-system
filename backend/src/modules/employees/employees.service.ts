import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee, EmployeeStatus } from '../../entities/employee.entity';
import { Hospital } from '../../entities/hospital.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Hospital)
    private hospitalRepository: Repository<Hospital>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    // 檢查工號是否已存在
    const existing = await this.employeeRepository.findOne({
      where: { employeeNo: createEmployeeDto.employeeNo },
    });
    if (existing) {
      throw new ConflictException('工號已存在');
    }

    const employee = this.employeeRepository.create(createEmployeeDto);

    // 設定預設密碼 (工號)
    employee.passwordHash = await bcrypt.hash(createEmployeeDto.employeeNo, 10);

    // 設定關聯的院區
    if (createEmployeeDto.hospitalIds?.length) {
      const hospitals = await this.hospitalRepository.findBy({
        id: In(createEmployeeDto.hospitalIds),
      });
      employee.hospitals = hospitals;
    }

    return this.employeeRepository.save(employee);
  }

  async findAll(query: QueryEmployeeDto) {
    const {
      page = 1,
      limit = 20,
      hospitalId,
      status,
      isLeader,
      keyword,
    } = query;

    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.hospitals', 'hospital');

    if (hospitalId) {
      queryBuilder.andWhere('hospital.id = :hospitalId', { hospitalId });
    }

    if (status) {
      queryBuilder.andWhere('employee.status = :status', { status });
    }

    if (isLeader !== undefined) {
      queryBuilder.andWhere('employee.isLeader = :isLeader', { isLeader });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(employee.name LIKE :keyword OR employee.employeeNo LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('employee.employeeNo', 'ASC')
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: ['hospitals'],
    });
    if (!employee) {
      throw new NotFoundException('員工不存在');
    }
    return employee;
  }

  async findByHospital(hospitalId: string, options?: { isLeader?: boolean; canDay?: boolean; canNight?: boolean }) {
    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoin('employee.hospitals', 'hospital')
      .where('hospital.id = :hospitalId', { hospitalId })
      .andWhere('employee.status = :status', { status: EmployeeStatus.ACTIVE });

    if (options?.isLeader !== undefined) {
      queryBuilder.andWhere('employee.isLeader = :isLeader', { isLeader: options.isLeader });
    }

    if (options?.canDay !== undefined) {
      queryBuilder.andWhere('employee.canDay = :canDay', { canDay: options.canDay });
    }

    if (options?.canNight !== undefined) {
      queryBuilder.andWhere('employee.canNight = :canNight', { canNight: options.canNight });
    }

    return queryBuilder.getMany();
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);

    // 更新關聯的院區
    if (updateEmployeeDto.hospitalIds) {
      const hospitals = await this.hospitalRepository.findBy({
        id: In(updateEmployeeDto.hospitalIds),
      });
      employee.hospitals = hospitals;
    }

    // 移除 hospitalIds，因為它不是實體屬性
    const { hospitalIds, ...updateData } = updateEmployeeDto;

    Object.assign(employee, updateData);
    return this.employeeRepository.save(employee);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.remove(employee);
  }

  async resetPassword(id: string): Promise<{ message: string }> {
    const employee = await this.findOne(id);
    employee.passwordHash = await bcrypt.hash(employee.employeeNo, 10);
    await this.employeeRepository.save(employee);
    return { message: '密碼已重設為工號' };
  }

  async getLeaders(hospitalId?: string) {
    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.hospitals', 'hospital')
      .where('employee.isLeader = true OR employee.isDeputy = true')
      .andWhere('employee.status = :status', { status: EmployeeStatus.ACTIVE });

    if (hospitalId) {
      queryBuilder.andWhere('hospital.id = :hospitalId', { hospitalId });
    }

    return queryBuilder.getMany();
  }
}
