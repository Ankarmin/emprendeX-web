import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { CreateUsersTable20260516000000 } from './migrations/20260516000000-create-users-table';
import { AddEnabledModuleIdsToUsers20260516001000 } from './migrations/20260516001000-add-enabled-module-ids-to-users';
import { User } from '../users/entities/user.entity';

function isSslEnabled(configService: ConfigService): boolean {
  return configService.get<string>('DATABASE_SSL', 'false') === 'true';
}

export const typeOrmModuleOptions: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    url: configService.getOrThrow<string>('DATABASE_PUBLIC_URL'),
    entities: [User],
    migrations: [
      CreateUsersTable20260516000000,
      AddEnabledModuleIdsToUsers20260516001000,
    ],
    migrationsRun: true,
    synchronize: false,
    ssl: isSslEnabled(configService)
      ? {
          rejectUnauthorized: false,
        }
      : false,
  }),
};
