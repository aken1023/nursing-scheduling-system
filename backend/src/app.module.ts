import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { EmployeesModule } from './modules/employees/employees.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { LeavesModule } from './modules/leaves/leaves.module';
import { CrossHospitalModule } from './modules/cross-hospital/cross-hospital.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ExportModule } from './modules/export/export.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // 環境變數設定
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    // 提供前端靜態檔案
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'frontend', 'dist'),
      exclude: ['/api/(.*)'],
    }),
    // 資料庫連線設定
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // 生產環境請設為 false
        logging: configService.get('NODE_ENV') === 'development',
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),
    // 功能模組
    AuthModule,
    EmployeesModule,
    HospitalsModule,
    ShiftsModule,
    LeavesModule,
    CrossHospitalModule,
    NotificationsModule,
    ExportModule,
  ],
})
export class AppModule {}
