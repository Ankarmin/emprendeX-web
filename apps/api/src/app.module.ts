import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerGuard, ThrottlerModule, minutes } from '@nestjs/throttler';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { CalendarModule } from './calendar/calendar.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BusinessPreferencesModule } from './business-preferences/business-preferences.module';
import { validateEnvironment } from './config/environment.validation';
import { RlsModule } from './database/rls/rls.module';
import { CustomersModule } from './customers/customers.module';
import { HealthModule } from './health/health.module';
import { typeOrmModuleOptions } from './database/typeorm.config';
import { FinanceModule } from './finance/finance.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { CatalogModule } from './catalog/catalog.module';
import { PlansModule } from './plans/plans.module';
import { PublicCatalogModule } from './public-catalog/public-catalog.module';
import {
  PUBLIC_CATALOG_READ_LIMIT,
  PUBLIC_CATALOG_READ_TTL_MINUTES,
  PUBLIC_CATALOG_SUBMIT_LIMIT,
  PUBLIC_CATALOG_SUBMIT_TTL_MINUTES,
} from './public-catalog/public-catalog.config';
import { ReportsModule } from './reports/reports.module';
import { SalesModule } from './sales/sales.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    RlsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: '.env.local',
      validate: validateEnvironment,
    }),
    CacheModule.register({ isGlobal: true, ttl: 30_000 }),
    ThrottlerModule.forRoot([
      {
        name: 'publicCatalogRead',
        ttl: minutes(PUBLIC_CATALOG_READ_TTL_MINUTES),
        limit: PUBLIC_CATALOG_READ_LIMIT,
      },
      {
        name: 'publicCatalogSubmit',
        ttl: minutes(PUBLIC_CATALOG_SUBMIT_TTL_MINUTES),
        limit: PUBLIC_CATALOG_SUBMIT_LIMIT,
      },
    ]),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    AuditLogsModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    CustomersModule,
    SalesModule,
    FinanceModule,
    PlansModule,
    PublicCatalogModule,
    BusinessPreferencesModule,
    ReportsModule,
    CalendarModule,
    OnboardingModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [],
})
export class AppModule {}
