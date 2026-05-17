import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseEntities } from '../database/database.entities';
import { UsersBootstrapService } from './users.bootstrap.service';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature(databaseEntities)],
  providers: [UsersService, UsersBootstrapService],
  exports: [UsersService],
})
export class UsersModule {}
