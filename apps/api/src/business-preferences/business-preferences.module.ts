import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { Business } from '../businesses/entities/business.entity';
import { BusinessPreferencesEntity } from '../businesses/entities/business-preferences.entity';
import { BusinessPreferencesController } from './business-preferences.controller';
import { BusinessPreferencesService } from './business-preferences.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, BusinessPreferencesEntity]),
    AuditLogsModule,
  ],
  controllers: [BusinessPreferencesController],
  providers: [BusinessPreferencesService],
  exports: [BusinessPreferencesService],
})
export class BusinessPreferencesModule {}
