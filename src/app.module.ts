import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './config/environment.validation';
import { HealthModule } from './health/health.module';
import { typeOrmModuleOptions } from './database/typeorm.config';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    UsersModule,
    AuthModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
