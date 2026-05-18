import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createRequire } from 'node:module';
import request from 'supertest';
import { App } from 'supertest/types';

const loadModule = createRequire(__filename);

function createEmptyModule() {
  @Module({})
  class EmptyModule {}

  return EmptyModule;
}

describe('AppModule (e2e)', () => {
  let app: INestApplication<App> | undefined;

  beforeEach(async () => {
    jest.resetModules();
    process.env.DATABASE_PUBLIC_URL =
      'postgresql://postgres:password@localhost:5432/emprendex_test';
    process.env.JWT_SECRET = 'test-jwt-secret-123';

    jest.doMock('../src/auth/auth.module', () => ({
      AuthModule: createEmptyModule(),
    }));
    jest.doMock('../src/catalog/catalog.module', () => ({
      CatalogModule: createEmptyModule(),
    }));
    jest.doMock('../src/onboarding/onboarding.module', () => ({
      OnboardingModule: createEmptyModule(),
    }));
    jest.doMock('../src/users/users.module', () => ({
      UsersModule: createEmptyModule(),
    }));
    jest.doMock('@nestjs/typeorm', () => ({
      TypeOrmModule: {
        forRootAsync: jest.fn(() => createEmptyModule()),
      },
    }));

    const appModuleImport = loadModule(
      './../src/app.module',
    ) as typeof import('./../src/app.module');
    const { AppModule } = appModuleImport;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) returns not found when no root route is registered', () => {
    return request(app.getHttpServer()).get('/').expect(404);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });
});
