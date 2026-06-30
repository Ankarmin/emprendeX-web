import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  const apiUrl =
    configService.get<string>('API_URL') ??
    (configService.get<string>('RAILWAY_PUBLIC_DOMAIN')
      ? `https://${configService.get<string>('RAILWAY_PUBLIC_DOMAIN')}`
      : undefined) ??
    `http://localhost:${Number(configService.get<string>('PORT') ?? 3000)}`;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('emprendeX API')
    .setDescription(
      'API REST para la plataforma emprendeX — gestión de negocios, catálogo, ventas, finanzas y más.',
    )
    .setVersion('4.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT de autenticación',
      },
      'JWT-auth',
    )
    .addServer(apiUrl, 'Servidor actual')
    .build();

  const swaggerPath =
    configService.get<string>('SWAGGER_DOCS_PATH') ?? 'api/docs';
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = Number(configService.get<string>('PORT') ?? 3000);

  await app.listen(port);
}
void bootstrap();
