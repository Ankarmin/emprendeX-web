import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { Business } from '../businesses/entities/business.entity';
import { ItemEntity } from '../catalog/entities/item.entity';
import { UsersModule } from '../users/users.module';
import { PublicCatalogController } from './public-catalog.controller';
import { PublicCatalogService } from './public-catalog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, ItemEntity]),
    AuditLogsModule,
    UsersModule,
  ],
  controllers: [PublicCatalogController],
  providers: [PublicCatalogService],
  exports: [PublicCatalogService],
})
export class PublicCatalogModule {}
