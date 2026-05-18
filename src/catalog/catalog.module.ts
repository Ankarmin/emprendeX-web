import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseEntities } from '../database/database.entities';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [TypeOrmModule.forFeature(databaseEntities)],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
