import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseEntities } from '../database/database.entities';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature(databaseEntities)],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
