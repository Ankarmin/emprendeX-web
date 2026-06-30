import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryFailedError, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Business } from '../businesses/entities/business.entity';
import { ItemEntity } from '../catalog/entities/item.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { normalizeDni } from '../common/utils/dni.util';
import { normalizePublicCatalogSlug } from '../common/utils/public-catalog-slug.util';
import { Customer } from '../customers/entities/customer.entity';
import {
  AuditAction,
  ColorPaletteId,
  ItemClass,
  QuotationOrigin,
} from '../database/database.enums';
import { QuotationDetailEntity } from '../quotations/entities/quotation-detail.entity';
import { QuotationEntity } from '../quotations/entities/quotation.entity';
import { UsersService } from '../users/users.service';
import { SubmitPublicQuotationDto } from './dto/submit-public-quotation.dto';
import {
  MAX_PUBLIC_ITEM_QUANTITY,
  MAX_PUBLIC_QUOTATION_ITEMS,
} from './public-catalog.config';
import { UpdateBusinessPublicCatalogDto } from './dto/update-business-public-catalog.dto';
import { RlsContextService } from '../database/rls/rls-context.service';

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

@Injectable()
export class PublicCatalogService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    private readonly rlsContextService: RlsContextService,
    private readonly auditLogsService: AuditLogsService,
    private readonly usersService: UsersService,
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
    @InjectRepository(ItemEntity)
    private readonly itemsRepository: Repository<ItemEntity>,
  ) {}

  async getPublicCatalog(slug: string) {
    const business = await this.findPublicBusinessOrThrow(slug, {
      preferences: true,
    });
    const items = await this.loadPublicBusinessItems(business.businessId);

    return {
      business: {
        id: business.businessId,
        name: business.businessName,
        category: business.businessCategory,
        slug: business.publicCatalogSlug,
        logoUrl: business.preferences?.logoUrl ?? null,
        colorPaletteId:
          business.preferences?.colorPaletteId ?? ColorPaletteId.Violet,
      },
      items: items.map((item) => this.mapPublicCatalogItem(item)),
    };
  }

  async getPublicCatalogProfile(slug: string) {
    const business = await this.findPublicBusinessOrThrow(slug, {
      preferences: true,
    });

    return this.mapPublicCatalogProfile(business);
  }

  async getPublicCatalogItems(slug: string) {
    const business = await this.findPublicBusinessOrThrow(slug);
    const items = await this.loadPublicBusinessItems(business.businessId);

    return items.map((item) => this.mapPublicCatalogFunctionItem(item));
  }

  async submitPublicQuotation(
    slug: string,
    dto: SubmitPublicQuotationDto,
    clientIp: string | null,
  ) {
    await this.verifyTurnstileOrThrow(dto.turnstileToken, clientIp);

    const normalizedSlug = normalizePublicCatalogSlug(slug);
    const itemIds = dto.items.map((item) => item.itemId);
    const uniqueItemIds = Array.from(new Set(itemIds));

    if (uniqueItemIds.length !== itemIds.length) {
      throw new BadRequestException(
        'No se permiten items repetidos en la cotización',
      );
    }

    if (dto.items.some((item) => item.quantity > MAX_PUBLIC_ITEM_QUANTITY)) {
      throw new BadRequestException(
        `Cada item permite hasta ${MAX_PUBLIC_ITEM_QUANTITY} unidades por cotización`,
      );
    }

    if (dto.items.length > MAX_PUBLIC_QUOTATION_ITEMS) {
      throw new BadRequestException(
        `Solo puedes enviar hasta ${MAX_PUBLIC_QUOTATION_ITEMS} items por cotización`,
      );
    }

    const normalizedDni = normalizeDni(dto.customer.dni);
    const normalizedEmail = dto.customer.email?.trim().toLowerCase() || null;
    const normalizedPhone = dto.customer.phone?.trim() || null;
    const isExistingCustomerFlow = dto.customer.mode === 'existing';

    try {
      const quotation = await this.dataSource.transaction(async (manager) => {
        const business = await manager.getRepository(Business).findOne({
          where: {
            publicCatalogSlug: normalizedSlug,
            catalogIsPublic: true,
          },
        });

        if (!business) {
          throw new NotFoundException('Catálogo público no encontrado');
        }

        const items = await manager.getRepository(ItemEntity).find({
          where: {
            businessId: business.businessId,
            itemId: In(uniqueItemIds),
          },
          relations: {
            product: true,
          },
        });

        if (items.length !== uniqueItemIds.length) {
          throw new BadRequestException(
            'Uno o más items no son válidos para este catálogo',
          );
        }

        const itemMap = new Map(items.map((item) => [item.itemId, item]));
        let customer = await manager.getRepository(Customer).findOne({
          where: {
            businessId: business.businessId,
            dni: normalizedDni,
          },
        });

        if (isExistingCustomerFlow && !customer) {
          throw new BadRequestException(
            'No encontramos un cliente registrado con ese DNI en este negocio',
          );
        }

        if (!isExistingCustomerFlow && customer) {
          throw new ConflictException(
            'Ese DNI ya pertenece a un cliente registrado. Usa la opción de cliente antiguo.',
          );
        }

        if (!customer) {
          const firstNames = dto.customer.firstNames?.trim();

          if (!firstNames) {
            throw new BadRequestException(
              'Los nombres son obligatorios cuando el cliente aún no existe',
            );
          }

          customer = await manager.getRepository(Customer).save(
            manager.getRepository(Customer).create({
              businessId: business.businessId,
              firstNames,
              lastNames: dto.customer.lastNames?.trim() || null,
              dni: normalizedDni,
              email: normalizedEmail,
              phone: normalizedPhone,
              address: dto.customer.address?.trim() || null,
            }),
          );

          await this.auditLogsService.createWithManager(manager, {
            businessId: business.businessId,
            action: AuditAction.Create,
            tableName: 'customers',
            recordId: customer.customerId,
            newData: {
              customerId: customer.customerId,
              source: QuotationOrigin.PublicCatalog,
            },
          });
        }

        const total = dto.items.reduce((sum, requestedItem) => {
          const item = itemMap.get(requestedItem.itemId);

          if (!item) {
            throw new BadRequestException('Item de catálogo inválido');
          }

          if (
            item.itemClass === ItemClass.Product &&
            item.product &&
            requestedItem.quantity > item.product.stock
          ) {
            throw new BadRequestException(
              `La cantidad solicitada supera el stock disponible de ${item.name}`,
            );
          }

          return sum + requestedItem.quantity * Number(item.price);
        }, 0);

        for (const requestedItem of dto.items) {
          const item = itemMap.get(requestedItem.itemId);

          if (!item) {
            throw new BadRequestException('Item de catálogo inválido');
          }

          if (item.itemClass !== ItemClass.Product) {
            continue;
          }

          const result = await manager
            .createQueryBuilder()
            .update(ProductEntity)
            .set({ stock: () => '"stock" - :quantity' })
            .where('business_id = :businessId', {
              businessId: business.businessId,
            })
            .andWhere('item_id = :itemId', { itemId: item.itemId })
            .andWhere('stock >= :quantity', { quantity: requestedItem.quantity })
            .execute();

          if (result.affected !== 1) {
            throw new BadRequestException(
              `La cantidad solicitada supera el stock disponible de ${item.name}`,
            );
          }
        }

        const quotationsRepository = manager.getRepository(QuotationEntity);
        const quotationDetailsRepository = manager.getRepository(
          QuotationDetailEntity,
        );
        const createdQuotation = await quotationsRepository.save(
          quotationsRepository.create({
            businessId: business.businessId,
            customerId: customer.customerId,
            origin: QuotationOrigin.PublicCatalog,
            description: dto.description?.trim() || null,
            deliveryDate: new Date(dto.deliveryDate),
            deliveryMethod: dto.deliveryMethod,
            total: total.toFixed(2),
          }),
        );

        await quotationDetailsRepository.save(
          dto.items.map((requestedItem) => {
            const item = itemMap.get(requestedItem.itemId);

            if (!item) {
              throw new BadRequestException('Item de catálogo inválido');
            }

            return quotationDetailsRepository.create({
              businessId: business.businessId,
              quotationId: createdQuotation.quotationId,
              itemId: item.itemId,
              quantity: requestedItem.quantity,
              unitPrice: item.price,
              discount: '0.00',
            });
          }),
        );

        await this.auditLogsService.createWithManager(manager, {
          businessId: business.businessId,
          action: AuditAction.Create,
          tableName: 'quotations',
          recordId: createdQuotation.quotationId,
          newData: {
            quotationId: createdQuotation.quotationId,
            customerId: customer.customerId,
            source: QuotationOrigin.PublicCatalog,
          },
        });

        return quotationsRepository.findOneOrFail({
          where: {
            quotationId: createdQuotation.quotationId,
            businessId: business.businessId,
          },
        });
      });

      return {
        quotationId: quotation.quotationId,
        referenceCode: quotation.referenceCode,
        origin: quotation.origin,
        total: quotation.total,
      };
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException(
          this.getCustomerUniqueViolationMessage(error),
        );
      }

      throw error;
    }
  }

  async getMyCatalogSettings(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getOwnedBusinessOrThrow(userId, manager);
      return this.mapBusinessCatalogSettings(business);
    });
  }

  async updateMyCatalogSettings(
    userId: string,
    dto: UpdateBusinessPublicCatalogDto,
  ) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const businessesRepository = manager.getRepository(Business);
      const business = await this.getOwnedBusinessOrThrow(userId, manager);

      if (dto.publicCatalogSlug !== undefined) {
        if (!dto.publicCatalogSlug.trim()) {
          throw new BadRequestException(
            'El slug del catálogo público no puede estar vacío',
          );
        }

        const normalizedSlug = normalizePublicCatalogSlug(
          dto.publicCatalogSlug,
        );

        const existingBusiness = await businessesRepository.findOne({
          where: { publicCatalogSlug: normalizedSlug },
        });

        if (
          existingBusiness &&
          existingBusiness.businessId !== business.businessId
        ) {
          throw new ConflictException(
            'El slug del catálogo público ya está en uso',
          );
        }

        business.publicCatalogSlug = normalizedSlug;
      }

      if (dto.catalogIsPublic !== undefined) {
        business.catalogIsPublic = dto.catalogIsPublic;
      }

      try {
        const savedBusiness = await businessesRepository.save(business);

        await this.auditLogsService.createWithManager(manager, {
          actorUserId: userId,
          businessId: savedBusiness.businessId,
          action: AuditAction.Update,
          tableName: 'businesses',
          recordId: savedBusiness.businessId,
          newData: {
            publicCatalogSlug: savedBusiness.publicCatalogSlug,
            catalogIsPublic: savedBusiness.catalogIsPublic,
          },
        });

        return this.mapBusinessCatalogSettings(savedBusiness);
      } catch (error) {
        if (
          error instanceof QueryFailedError &&
          this.isUniqueViolation(error)
        ) {
          throw new ConflictException(
            'El slug del catálogo público ya está en uso',
          );
        }

        throw error;
      }
    });
  }

  private async getOwnedBusinessOrThrow(
    userId: string,
    manager?: import('typeorm').EntityManager,
  ) {
    const business = await this.usersService.findPrimaryBusinessByUserId(
      userId,
      manager,
    );

    if (!business) {
      throw new BadRequestException('Business profile is not configured');
    }

    return business;
  }

  private async findPublicBusinessOrThrow(
    slug: string,
    relations?: { preferences?: true },
  ) {
    const normalizedSlug = normalizePublicCatalogSlug(slug);
    const business = await this.businessesRepository.findOne({
      where: {
        publicCatalogSlug: normalizedSlug,
        catalogIsPublic: true,
      },
      relations,
    });

    if (!business) {
      throw new NotFoundException('Catálogo público no encontrado');
    }

    return business;
  }

  private async loadPublicBusinessItems(businessId: string) {
    return this.itemsRepository
      .createQueryBuilder('item')
      .innerJoin('item.business', 'business')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.unit', 'unit')
      .leftJoinAndSelect('item.product', 'product')
      .where('business.businessId = :businessId', { businessId })
      .andWhere('business.catalogIsPublic = true')
      .orderBy('item.itemClass', 'ASC')
      .addOrderBy('category.categoryName', 'ASC')
      .addOrderBy('item.name', 'ASC')
      .getMany();
  }

  private mapPublicCatalogItem(item: ItemEntity) {
    return {
      id: item.itemId,
      itemClass: item.itemClass,
      referenceCode: item.referenceCode,
      sku: item.sku,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: item.price,
      stock:
        item.itemClass === ItemClass.Product
          ? (item.product?.stock ?? null)
          : null,
      unit: {
        id: item.unit.unitId,
        name: item.unit.unitName,
      },
      category: {
        id: item.category.categoryId,
        name: item.category.categoryName,
      },
    };
  }

  private mapPublicCatalogProfile(business: Business) {
    return {
      businessName: business.businessName,
      businessCategory: business.businessCategory,
      publicCatalogSlug: business.publicCatalogSlug,
      logoUrl: business.preferences?.logoUrl ?? null,
      colorPaletteId: business.preferences?.colorPaletteId ?? ColorPaletteId.Violet,
    };
  }

  private mapPublicCatalogFunctionItem(item: ItemEntity) {
    return {
      id: item.itemId,
      itemClass: item.itemClass,
      referenceCode: item.referenceCode,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      price: Number(item.price),
      categoryName: item.category.categoryName,
      unitName: item.unit.unitName,
      stock:
        item.itemClass === ItemClass.Product ? (item.product?.stock ?? null) : null,
    };
  }

  private mapBusinessCatalogSettings(business: Business) {
    return {
      businessId: business.businessId,
      businessName: business.businessName,
      publicCatalogSlug: business.publicCatalogSlug,
      catalogIsPublic: business.catalogIsPublic,
      publicCatalogUrl: this.buildPublicCatalogUrl(business.publicCatalogSlug),
    };
  }

  private buildPublicCatalogUrl(slug: string) {
    const webPublicUrl = this.configService
      .getOrThrow<string>('WEB_PUBLIC_URL')
      .replace(/\/+$/, '');

    return `${webPublicUrl}/catalogo/${slug}`;
  }

  private async verifyTurnstileOrThrow(
    turnstileToken: string | undefined,
    clientIp: string | null,
  ) {
    const turnstileSecretKey = this.configService
      .get<string>('PUBLIC_CATALOG_TURNSTILE_SECRET_KEY')
      ?.trim();

    if (!turnstileSecretKey) {
      return;
    }

    if (!turnstileToken?.trim()) {
      throw new BadRequestException(
        'Completa la verificación de seguridad antes de enviar tu cotización',
      );
    }

    const body = new URLSearchParams({
      secret: turnstileSecretKey,
      response: turnstileToken.trim(),
    });

    if (clientIp) {
      body.set('remoteip', clientIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      throw new BadRequestException(
        'No se pudo validar la verificación de seguridad',
      );
    }

    const payload = (await response.json()) as { success?: boolean };

    if (!payload.success) {
      throw new BadRequestException(
        'No se pudo validar la verificación de seguridad',
      );
    }
  }

  private isUniqueViolation(error: {
    driverError?: { code?: string };
  }): boolean {
    return error.driverError?.code === '23505';
  }

  private getCustomerUniqueViolationMessage(error: {
    driverError?: { constraint?: string };
  }): string {
    switch (error.driverError?.constraint) {
      case 'uq_customers_business_dni':
        return 'El DNI del cliente ya existe en este negocio';
      case 'uq_customers_business_email':
      case 'uq_customers_business_phone':
        return 'El email o telefono del cliente ya existe en este negocio';
      default:
        return 'Ya existe un cliente con los mismos datos en este negocio';
    }
  }
}
