import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function resolveCorsOrigins(corsOrigins: string | undefined): string[] {
  if (!corsOrigins || corsOrigins.trim() === '') {
    return [
      'http://localhost:3001',
      'http://localhost:8081',
      'http://localhost:19006',
    ];
  }

  return corsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.enableCors({
    origin: resolveCorsOrigins(configService.get<string>('CORS_ORIGINS')),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.enableShutdownHooks();

  const port = Number(configService.get<string>('PORT') ?? 3000);

  await app.listen(port);
}
void bootstrap();
