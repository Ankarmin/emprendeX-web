import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  DeliveryMethod,
  QuotationOrigin,
} from '../src/database/database.enums';
import { PublicCatalogController } from '../src/public-catalog/public-catalog.controller';
import { PublicCatalogService } from '../src/public-catalog/public-catalog.service';

describe('PublicCatalogController (e2e)', () => {
  let app: INestApplication<App>;

  const publicCatalogService = {
    getPublicCatalog: jest.fn(() =>
      Promise.resolve({
        business: {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'EmprendeX Studio',
          category: 'Servicios creativos',
          slug: 'emprendex-studio',
          logoUrl: 'https://cdn.emprendex.com/logos/studio.png',
          colorPaletteId: 'ocean',
        },
        items: [
          {
            id: '55555555-5555-4555-8555-555555555555',
            itemClass: 'Producto',
            referenceCode: 'PRD-001',
            sku: 'CAF-001',
            name: 'Café especial',
            description: 'Producto público',
            imageUrl: null,
            price: '12.00',
            stock: 5,
            unit: { id: 'Bolsa', name: 'Bolsa' },
            category: { id: 'Bebidas', name: 'Bebidas' },
          },
        ],
      }),
    ),
    getPublicCatalogProfile: jest.fn(() =>
      Promise.resolve({
        businessName: 'EmprendeX Studio',
        businessCategory: 'Servicios creativos',
        publicCatalogSlug: 'emprendex-studio',
        logoUrl: 'https://cdn.emprendex.com/logos/studio.png',
        colorPaletteId: 'ocean',
      }),
    ),
    getPublicCatalogItems: jest.fn(() =>
      Promise.resolve([
        {
          id: '55555555-5555-4555-8555-555555555555',
          itemClass: 'Servicio',
          referenceCode: 'SRV-001',
          name: 'Branding express',
          description: 'Servicio creativo',
          imageUrl: 'https://cdn.emprendex.com/items/branding.png',
          price: 120,
          categoryName: 'Diseño',
          unitName: 'Proyecto',
          stock: null,
        },
      ]),
    ),
    submitPublicQuotation: jest.fn(() =>
      Promise.resolve({
        quotationId: '44444444-4444-4444-4444-444444444444',
        referenceCode: 'COT-1',
        origin: QuotationOrigin.PublicCatalog,
        total: '120.00',
      }),
    ),
    getMyCatalogSettings: jest.fn(),
    updateMyCatalogSettings: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicCatalogController],
      providers: [
        {
          provide: PublicCatalogService,
          useValue: publicCatalogService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /catalogo-publico/:slug resolves a public catalog', async () => {
    await request(app.getHttpServer())
      .get('/catalogo-publico/emprendex-studio')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            business: { name: string; slug: string; colorPaletteId: string };
            items: Array<{ id: string; stock: number | null }>;
          };
        }) => {
          expect(body.business.name).toBe('EmprendeX Studio');
          expect(body.business.slug).toBe('emprendex-studio');
          expect(body.business.colorPaletteId).toBe('ocean');
          expect(body.items[0]?.id).toBe(
            '55555555-5555-4555-8555-555555555555',
          );
          expect(body.items[0]?.stock).toBe(5);
        },
      );
  });

  it('GET /public-catalog/:slug/profile resolves profile branding', async () => {
    await request(app.getHttpServer())
      .get('/public-catalog/emprendex-studio/profile')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: { businessName: string; colorPaletteId: string };
        }) => {
          expect(body.businessName).toBe('EmprendeX Studio');
          expect(body.colorPaletteId).toBe('ocean');
        },
      );
  });

  it('GET /public-catalog/:slug/items resolves public items', async () => {
    await request(app.getHttpServer())
      .get('/public-catalog/emprendex-studio/items')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: Array<{ referenceCode: string; stock: number | null }>;
        }) => {
          expect(body[0]?.referenceCode).toBe('SRV-001');
          expect(body[0]?.stock).toBeNull();
        },
      );
  });

  it('POST /catalogo-publico/:slug/cotizaciones sends a public quotation', async () => {
    await request(app.getHttpServer())
      .post('/catalogo-publico/emprendex-studio/cotizaciones')
      .send({
        customer: {
          dni: '12345678',
          firstNames: 'Juan',
        },
        items: [
          {
            itemId: '55555555-5555-4555-8555-555555555555',
            quantity: 1,
          },
        ],
        deliveryDate: '2026-06-10T00:00:00.000Z',
        deliveryMethod: DeliveryMethod.HomeDelivery,
      })
      .expect(201)
      .expect(
        ({ body }: { body: { referenceCode: string; origin: string } }) => {
          expect(body.referenceCode).toBe('COT-1');
          expect(body.origin).toBe(QuotationOrigin.PublicCatalog);
        },
      );
  });
});
