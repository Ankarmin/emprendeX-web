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
import { ProductosServiciosEntity } from './entities/service.entity';
import { UnitEntity } from './entities/unit.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { BusinessModuleStatus, ItemClass } from '../database/database.enums';

type ProductosServiciosItemResponse = {
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
export class ProductosServiciosService {
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
    @InjectRepository(ProductosServiciosEntity)
    private readonly servicesRepository: Repository<ProductosServiciosEntity>,
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

  async getItems(userId: string): Promise<ProductosServiciosItemResponse[]> {
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
  ): Promise<ProductosServiciosItemResponse> {
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

    throw new NotFoundException('Productos y servicios item not found');
  }

  async createItem(
    userId: string,
    createItemDto: CreateItemDto,
  ): Promise<ProductosServiciosItemResponse> {
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

  async updateItem(
    userId: string,
    itemId: string,
    updateItemDto: UpdateItemDto,
  ): Promise<ProductosServiciosItemResponse> {
    const item = await this.getItemById(userId, itemId);
    const business = await this.getBusinessOrThrow(userId);

    if (item.itemClass === ItemClass.Product) {
      return this.updateProductItem(business.businessId, itemId, updateItemDto);
    }

    return this.updateServiceItem(business.businessId, itemId, updateItemDto);
  }

  async deleteItem(userId: string, itemId: string): Promise<void> {
    const item = await this.getItemById(userId, itemId);
    await this.getBusinessOrThrow(userId);

    await this.dataSource.transaction(async (manager) => {
      const itemsRepository = manager.getRepository(ItemEntity);
      const productsRepository = manager.getRepository(ProductEntity);
      const servicesRepository = manager.getRepository(
        ProductosServiciosEntity,
      );

      if (item.itemClass === ItemClass.Product) {
        await productsRepository.delete({ itemId });
      } else {
        await servicesRepository.delete({ itemId });
      }

      await itemsRepository.delete({ itemId });
    });
  }

  private async createProductItem(
    businessId: string,
    createItemDto: CreateItemDto,
  ): Promise<ProductosServiciosItemResponse> {
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
  ): Promise<ProductosServiciosItemResponse> {
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
      const servicesRepository = manager.getRepository(
        ProductosServiciosEntity,
      );

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

    await this.ensureProductosServiciosModuleEnabled(business.businessId);

    return business;
  }

  private async updateProductItem(
    businessId: string,
    itemId: string,
    updateItemDto: UpdateItemDto,
  ): Promise<ProductosServiciosItemResponse> {
    const product = await this.productsRepository.findOne({
      where: {
        itemId,
        unit: {
          businessId,
        },
      },
      relations: {
        item: true,
        unit: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let nextUnit = product.unit;

    if (updateItemDto.unitId) {
      const unit = await this.unitsRepository.findOne({
        where: {
          unitId: updateItemDto.unitId,
          businessId,
        },
      });

      if (!unit) {
        throw new BadRequestException(
          'Selected unit does not belong to the business',
        );
      }

      nextUnit = unit;
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const itemsRepository = manager.getRepository(ItemEntity);
        const productsRepository = manager.getRepository(ProductEntity);

        product.item.name = updateItemDto.name?.trim() || product.item.name;
        product.item.description =
          updateItemDto.description !== undefined
            ? updateItemDto.description.trim() || null
            : product.item.description;
        product.item.sku =
          updateItemDto.sku !== undefined
            ? updateItemDto.sku.trim() || null
            : product.item.sku;
        product.item.price = updateItemDto.price ?? product.item.price;

        await itemsRepository.save(product.item);

        product.unitId = nextUnit.unitId;
        product.unit = nextUnit;
        product.stock = updateItemDto.stock ?? product.stock;

        await productsRepository.save(product);
      });
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException('The SKU is already registered');
      }

      throw error;
    }

    return this.mapProductItem(product);
  }

  private async updateServiceItem(
    businessId: string,
    itemId: string,
    updateItemDto: UpdateItemDto,
  ): Promise<ProductosServiciosItemResponse> {
    const service = await this.servicesRepository.findOne({
      where: {
        itemId,
        category: {
          businessId,
        },
      },
      relations: {
        item: true,
        category: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    let nextCategory = service.category;

    if (updateItemDto.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: {
          categoryId: updateItemDto.categoryId,
          businessId,
        },
      });

      if (!category) {
        throw new BadRequestException(
          'Selected category does not belong to the business',
        );
      }

      nextCategory = category;
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        const itemsRepository = manager.getRepository(ItemEntity);
        const servicesRepository = manager.getRepository(
          ProductosServiciosEntity,
        );

        service.item.name = updateItemDto.name?.trim() || service.item.name;
        service.item.description =
          updateItemDto.description !== undefined
            ? updateItemDto.description.trim() || null
            : service.item.description;
        service.item.sku =
          updateItemDto.sku !== undefined
            ? updateItemDto.sku.trim() || null
            : service.item.sku;
        service.item.price = updateItemDto.price ?? service.item.price;

        await itemsRepository.save(service.item);

        service.categoryId = nextCategory.categoryId;
        service.category = nextCategory;

        await servicesRepository.save(service);
      });
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException('The SKU is already registered');
      }

      throw error;
    }

    return this.mapServiceItem(service);
  }

  private async ensureProductosServiciosModuleEnabled(
    businessId: string,
  ): Promise<void> {
    const productosServiciosModule =
      await this.businessModulesRepository.findOne({
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

    if (!productosServiciosModule) {
      throw new ForbiddenException(
        'The productos-servicios module is not enabled for this business',
      );
    }
  }

  private mapProductItem(
    product: ProductEntity,
  ): ProductosServiciosItemResponse {
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

  private mapServiceItem(
    service: ProductosServiciosEntity,
  ): ProductosServiciosItemResponse {
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
