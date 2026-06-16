import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { BusinessPreferencesController } from '../src/business-preferences/business-preferences.controller';
import { BusinessPreferencesService } from '../src/business-preferences/business-preferences.service';

describe('BusinessPreferencesController (e2e)', () => {
  let app: INestApplication<App>;

  const businessPreferencesService = {
    getMyPreferences: jest.fn(() =>
      Promise.resolve({
        businessPreferenceId: '11111111-1111-1111-1111-111111111111',
        businessId: '22222222-2222-2222-2222-222222222222',
        colorPaletteId: 'violet',
        logoUrl: null,
        createdAt: '2026-06-11T12:00:00.000Z',
        updatedAt: '2026-06-11T12:00:00.000Z',
      }),
    ),
    updateMyPreferences: jest.fn(() =>
      Promise.resolve({
        businessPreferenceId: '11111111-1111-1111-1111-111111111111',
        businessId: '22222222-2222-2222-2222-222222222222',
        colorPaletteId: 'ocean',
        logoUrl: 'https://cdn.emprendex.com/logos/demo.png',
        createdAt: '2026-06-11T12:00:00.000Z',
        updatedAt: '2026-06-11T13:00:00.000Z',
      }),
    ),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BusinessPreferencesController],
      providers: [
        {
          provide: BusinessPreferencesService,
          useValue: businessPreferencesService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const request = context.switchToHttp().getRequest<{
            user?: { id: string };
          }>();
          request.user = { id: '99999999-9999-9999-9999-999999999999' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /business/preferences resolves current preferences', async () => {
    await request(app.getHttpServer())
      .get('/business/preferences')
      .expect(200)
      .expect(({ body }: { body: { colorPaletteId: string } }) => {
        expect(body.colorPaletteId).toBe('violet');
      });
  });

  it('PATCH /business/preferences updates current preferences', async () => {
    await request(app.getHttpServer())
      .patch('/business/preferences')
      .send({
        colorPaletteId: 'ocean',
        logoUrl: 'https://cdn.emprendex.com/logos/demo.png',
      })
      .expect(200)
      .expect(
        ({ body }: { body: { colorPaletteId: string; logoUrl: string } }) => {
          expect(body.colorPaletteId).toBe('ocean');
          expect(body.logoUrl).toBe('https://cdn.emprendex.com/logos/demo.png');
        },
      );
  });
});
