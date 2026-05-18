import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseEntities } from '../database/database.entities';
import { ProductosServiciosController } from './catalog.controller';
import { ProductosServiciosService } from './catalog.service';

@Module({
  imports: [TypeOrmModule.forFeature(databaseEntities)],
  controllers: [ProductosServiciosController],
  providers: [ProductosServiciosService],
})
export class ProductosServiciosModule {}
