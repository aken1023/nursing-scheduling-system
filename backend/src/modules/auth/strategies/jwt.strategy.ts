import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../../../entities/employee.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'nursing-schedule-secret',
    });
  }

  async validate(payload: any) {
    // Fetch user's current hospital assignments for real-time access control
    const employee = await this.employeeRepository.findOne({
      where: { id: payload.sub },
      relations: ['hospitals'],
    });

    return {
      sub: payload.sub,
      employeeNo: payload.employeeNo,
      name: payload.name,
      role: payload.role,
      isLeader: payload.isLeader,
      isDeputy: employee?.isDeputy || false,
      hospitalIds: employee?.hospitals?.map((h) => h.id) || [],
    };
  }
}
