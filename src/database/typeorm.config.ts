import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { databaseEntities } from './database.entities';
import { AddCatalogCore20260517020000 } from './migrations/20260517020000-add-catalog-core';
import { InitializePlatformSchema20260517000000 } from './migrations/20260517000000-initialize-platform-schema';

function isSslEnabled(configService: ConfigService): boolean {
  return configService.get<string>('DATABASE_SSL', 'false') === 'true';
}

export const typeOrmModuleOptions: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    url: configService.getOrThrow<string>('DATABASE_PUBLIC_URL'),
    entities: databaseEntities,
    migrations: [
      InitializePlatformSchema20260517000000,
      AddCatalogCore20260517020000,
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
