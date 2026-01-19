import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Employee } from '../../entities/employee.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    private jwtService: JwtService,
  ) {}

  async validateUser(employeeNo: string, password: string): Promise<Employee | null> {
    const employee = await this.employeeRepository.findOne({
      where: { employeeNo },
      relations: ['hospitals'],
    });

    if (employee && employee.passwordHash) {
      const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);
      if (isPasswordValid) {
        return employee;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const employee = await this.validateUser(loginDto.employeeNo, loginDto.password);

    if (!employee) {
      throw new UnauthorizedException('工號或密碼錯誤');
    }

    if (employee.status !== 'active') {
      throw new UnauthorizedException('此帳號已停用');
    }

    const payload = {
      sub: employee.id,
      employeeNo: employee.employeeNo,
      name: employee.name,
      role: employee.role,
      isLeader: employee.isLeader,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: employee.id,
        employeeNo: employee.employeeNo,
        name: employee.name,
        role: employee.role,
        isLeader: employee.isLeader,
        hospitals: employee.hospitals,
      },
    };
  }

  async getProfile(userId: string) {
    const employee = await this.employeeRepository.findOne({
      where: { id: userId },
      relations: ['hospitals'],
    });

    if (!employee) {
      throw new UnauthorizedException('用戶不存在');
    }

    return {
      id: employee.id,
      employeeNo: employee.employeeNo,
      name: employee.name,
      gender: employee.gender,
      phone: employee.phone,
      email: employee.email,
      role: employee.role,
      isLeader: employee.isLeader,
      isDeputy: employee.isDeputy,
      canDay: employee.canDay,
      canNight: employee.canNight,
      hospitals: employee.hospitals,
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const employee = await this.employeeRepository.findOne({
      where: { id: userId },
    });

    if (!employee) {
      throw new UnauthorizedException('用戶不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, employee.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('原密碼錯誤');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.employeeRepository.update(userId, { passwordHash: hashedPassword });

    return { message: '密碼修改成功' };
  }
}
