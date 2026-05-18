import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { BusinessModule } from '../businesses/entities/business-module.entity';
import { CategoryEntity } from './entities/category.entity';
import { ItemEntity } from './entities/item.entity';
import { ProductEntity } from './entities/product.entity';
import { CatalogServiceEntity } from './entities/service.entity';
import { UnitEntity } from './entities/unit.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { BusinessModuleStatus, ItemClass } from '../database/database.enums';

type CatalogItemResponse = {
  id: string;
  itemClass: ItemClass;
  name: string;
  description: string | null;
  sku: string | null;
  price: string;
  createdAt: string;
  product: {
    productId: string;
    stock: number;
    unit: {
      unitId: string;
      unitName: string;
      abbreviation: string;
    };
  } | null;
  service: {
    serviceId: string;
    category: {
      categoryId: string;
      categoryName: string;
    };
  } | null;
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
    @InjectRepository(BusinessModule)
    private readonly businessModulesRepository: Repository<BusinessModule>,
    @InjectRepository(UnitEntity)
    private readonly unitsRepository: Repository<UnitEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
    @InjectRepository(ItemEntity)
    private readonly itemsRepository: Repository<ItemEntity>,
    @InjectRepository(ProductEntity)
    private readonly productsRepository: Repository<ProductEntity>,
    @InjectRepository(CatalogServiceEntity)
    private readonly servicesRepository: Repository<CatalogServiceEntity>,
  ) {}

  async getUnits(userId: string) {
    const business = await this.getBusinessOrThrow(userId);

    const units = await this.unitsRepository.find({
      where: { businessId: business.businessId },
      order: { createdAt: 'ASC', unitName: 'ASC' },
    });

    return units.map((unit) => ({
      unitId: unit.unitId,
      unitName: unit.unitName,
      abbreviation: unit.abbreviation,
    }));
  }

  async getCategories(userId: string) {
    const business = await this.getBusinessOrThrow(userId);

    const categories = await this.categoriesRepository.find({
      where: { businessId: business.businessId },
      order: { createdAt: 'ASC', categoryName: 'ASC' },
    });

    return categories.map((category) => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
    }));
  }

  async getItems(userId: string): Promise<CatalogItemResponse[]> {
    const business = await this.getBusinessOrThrow(userId);
    const [products, services] = await Promise.all([
      this.productsRepository.find({
        where: {
          unit: {
            businessId: business.businessId,
          },
        },
        relations: {
          item: true,
          unit: true,
        },
        order: {
          item: {
            createdAt: 'DESC',
          },
        },
      }),
      this.servicesRepository.find({
        where: {
          category: {
            businessId: business.businessId,
          },
        },
        relations: {
          item: true,
          category: true,
        },
        order: {
          item: {
            createdAt: 'DESC',
          },
        },
      }),
    ]);

    return [
      ...products.map((product) => this.mapProductItem(product)),
      ...services.map((service) => this.mapServiceItem(service)),
    ].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
  }

  async getItemById(
    userId: string,
    itemId: string,
  ): Promise<CatalogItemResponse> {
    const business = await this.getBusinessOrThrow(userId);

    const product = await this.productsRepository.findOne({
      where: {
        itemId,
        unit: {
          businessId: business.businessId,
        },
      },
      relations: {
        item: true,
        unit: true,
      },
    });

    if (product) {
      return this.mapProductItem(product);
    }

    const service = await this.servicesRepository.findOne({
      where: {
        itemId,
        category: {
          businessId: business.businessId,
        },
      },
      relations: {
        item: true,
        category: true,
      },
    });

    if (service) {
      return this.mapServiceItem(service);
    }

    throw new NotFoundException('Catalog item not found');
  }

  async createItem(
    userId: string,
    createItemDto: CreateItemDto,
  ): Promise<CatalogItemResponse> {
    const business = await this.getBusinessOrThrow(userId);

    try {
      if (createItemDto.itemClass === ItemClass.Product) {
        return await this.createProductItem(business.businessId, createItemDto);
      }

      return await this.createServiceItem(business.businessId, createItemDto);
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException('The SKU is already registered');
      }

      throw error;
    }
  }

  private async createProductItem(
    businessId: string,
    createItemDto: CreateItemDto,
  ): Promise<CatalogItemResponse> {
    if (!createItemDto.unitId) {
      throw new BadRequestException('Unit is required for products');
    }

    const unit = await this.unitsRepository.findOne({
      where: {
        unitId: createItemDto.unitId,
        businessId,
      },
    });

    if (!unit) {
      throw new BadRequestException(
        'Selected unit does not belong to the business',
      );
    }

    const savedProduct = await this.dataSource.transaction(async (manager) => {
      const itemsRepository = manager.getRepository(ItemEntity);
      const productsRepository = manager.getRepository(ProductEntity);

      const item = itemsRepository.create({
        itemClass: ItemClass.Product,
        name: createItemDto.name.trim(),
        description: createItemDto.description?.trim() || null,
        sku: createItemDto.sku?.trim() || null,
        price: createItemDto.price,
      });

      const savedItem = await itemsRepository.save(item);
      const product = productsRepository.create({
        itemId: savedItem.itemId,
        unitId: unit.unitId,
        stock: createItemDto.stock ?? 1,
      });

      const persistedProduct = await productsRepository.save(product);
      persistedProduct.item = savedItem;
      return persistedProduct;
    });

    savedProduct.unit = unit;

    return this.mapProductItem(savedProduct);
  }

  private async createServiceItem(
    businessId: string,
    createItemDto: CreateItemDto,
  ): Promise<CatalogItemResponse> {
    if (!createItemDto.categoryId) {
      throw new BadRequestException('Category is required for services');
    }

    const category = await this.categoriesRepository.findOne({
      where: {
        categoryId: createItemDto.categoryId,
        businessId,
      },
    });

    if (!category) {
      throw new BadRequestException(
        'Selected category does not belong to the business',
      );
    }

    const savedService = await this.dataSource.transaction(async (manager) => {
      const itemsRepository = manager.getRepository(ItemEntity);
      const servicesRepository = manager.getRepository(CatalogServiceEntity);

      const item = itemsRepository.create({
        itemClass: ItemClass.Service,
        name: createItemDto.name.trim(),
        description: createItemDto.description?.trim() || null,
        sku: createItemDto.sku?.trim() || null,
        price: createItemDto.price,
      });

      const savedItem = await itemsRepository.save(item);
      const service = servicesRepository.create({
        itemId: savedItem.itemId,
        categoryId: category.categoryId,
      });

      const persistedService = await servicesRepository.save(service);
      persistedService.item = savedItem;
      return persistedService;
    });

    savedService.category = category;

    return this.mapServiceItem(savedService);
  }

  private async getBusinessOrThrow(userId: string): Promise<Business> {
    const business = await this.businessesRepository.findOne({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    if (!business) {
      throw new BadRequestException('Business profile is not configured');
    }

    await this.ensureCatalogModuleEnabled(business.businessId);

    return business;
  }

  private async ensureCatalogModuleEnabled(businessId: string): Promise<void> {
    const catalogModule = await this.businessModulesRepository.findOne({
      where: {
        businessId,
        status: BusinessModuleStatus.Enabled,
        module: {
          moduleName: 'productos',
        },
      },
      relations: {
        module: true,
      },
    });

    if (!catalogModule) {
      throw new ForbiddenException(
        'The catalog module is not enabled for this business',
      );
    }
  }

  private mapProductItem(product: ProductEntity): CatalogItemResponse {
    return {
      id: product.item.itemId,
      itemClass: product.item.itemClass,
      name: product.item.name,
      description: product.item.description,
      sku: product.item.sku,
      price: product.item.price,
      createdAt: product.item.createdAt.toISOString(),
      product: {
        productId: product.productId,
        stock: product.stock,
        unit: {
          unitId: product.unit.unitId,
          unitName: product.unit.unitName,
          abbreviation: product.unit.abbreviation,
        },
      },
      service: null,
    };
  }

  private mapServiceItem(service: CatalogServiceEntity): CatalogItemResponse {
    return {
      id: service.item.itemId,
      itemClass: service.item.itemClass,
      name: service.item.name,
      description: service.item.description,
      sku: service.item.sku,
      price: service.item.price,
      createdAt: service.item.createdAt.toISOString(),
      product: null,
      service: {
        serviceId: service.serviceId,
        category: {
          categoryId: service.category.categoryId,
          categoryName: service.category.categoryName,
        },
      },
    };
  }

  private isUniqueViolation(error: {
    driverError?: { code?: string };
  }): boolean {
    const driverError = error.driverError;

    return driverError?.code === '23505';
  }
}
