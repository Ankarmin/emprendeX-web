import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { BusinessModule } from '../businesses/entities/business-module.entity';
import { BusinessModuleStatus, ItemClass } from '../database/database.enums';
import { RlsContextService } from '../database/rls/rls-context.service';
import { CategoryEntity } from './entities/category.entity';
import { ItemEntity } from './entities/item.entity';
import { ProductEntity } from './entities/product.entity';
import { ServiceEntity } from './entities/service.entity';
import { UnitEntity } from './entities/unit.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

type UnitResponse = {
  unitId: string;
  businessId: string;
  itemClass: ItemClass;
  unitName: string;
  createdAt: string;
  updatedAt: string;
};

type CategoryResponse = {
  categoryId: string;
  businessId: string;
  itemClass: ItemClass;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
};

type ItemResponse = {
  id: string;
  businessId: string;
  itemClass: ItemClass;
  name: string;
  description: string | null;
  sku: string | null;
  referenceCode: string;
  imageUrl: string | null;
  price: string;
  category: {
    id: string;
    name: string;
    itemClass: ItemClass;
  };
  unit: {
    id: string;
    name: string;
    itemClass: ItemClass;
  };
  stock: number | null;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly rlsContextService: RlsContextService,
    @InjectRepository(UnitEntity)
    private readonly unitsRepository: Repository<UnitEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
    @InjectRepository(ItemEntity)
    private readonly itemsRepository: Repository<ItemEntity>,
  ) {}

  async getUnits(userId: string, itemClass: ItemClass): Promise<UnitResponse[]> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const units = await manager.getRepository(UnitEntity).find({
        where: { businessId: business.businessId, itemClass },
        order: { unitName: 'ASC' },
      });

      return units.map((unit) => this.mapUnit(unit));
    });
  }

  async createUnit(
    userId: string,
    createUnitDto: CreateUnitDto,
  ): Promise<UnitResponse> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const unitsRepository = manager.getRepository(UnitEntity);
      const unitName = createUnitDto.unitName.trim();

      const existingUnit = await this.findUnitByName(
        business.businessId,
        createUnitDto.itemClass,
        unitName,
        unitsRepository,
      );
      if (existingUnit) {
        throw new ConflictException('La unidad ya está registrada');
      }

      const unit = await unitsRepository.save(
        unitsRepository.create({
          businessId: business.businessId,
          itemClass: createUnitDto.itemClass,
          unitName,
        }),
      );

      return this.mapUnit(unit);
    });
  }

  async updateUnit(
    userId: string,
    unitId: string,
    updateUnitDto: UpdateUnitDto,
  ): Promise<UnitResponse> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const unitsRepository = manager.getRepository(UnitEntity);
      const unit = await this.getUnitOrThrow(business.businessId, unitId, manager);

      if (updateUnitDto.unitName) {
        const unitName = updateUnitDto.unitName.trim();
        const existingUnit = await this.findUnitByName(
          business.businessId,
          unit.itemClass,
          unitName,
          unitsRepository,
        );

        if (existingUnit && existingUnit.unitId !== unit.unitId) {
          throw new ConflictException('La unidad ya está registrada');
        }

        unit.unitName = unitName;
      }

      return this.mapUnit(await unitsRepository.save(unit));
    });
  }

  async deleteUnit(userId: string, unitId: string): Promise<void> {
    await this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      await this.getUnitOrThrow(business.businessId, unitId, manager);

      const linkedItemsCount = await manager.getRepository(ItemEntity).count({
        where: { businessId: business.businessId, unitId },
      });

      if (linkedItemsCount > 0) {
        throw new ConflictException(
          'No se puede eliminar la unidad porque está asignada a items',
        );
      }

      await manager.getRepository(UnitEntity).delete({
        unitId,
        businessId: business.businessId,
      });
    });
  }

  async getCategories(
    userId: string,
    itemClass: ItemClass,
  ): Promise<CategoryResponse[]> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const categories = await manager.getRepository(CategoryEntity).find({
        where: { businessId: business.businessId, itemClass },
        order: { categoryName: 'ASC' },
      });

      return categories.map((category) => this.mapCategory(category));
    });
  }

  async createCategory(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponse> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const categoriesRepository = manager.getRepository(CategoryEntity);
      const categoryName = createCategoryDto.categoryName.trim();

      const existingCategory = await this.findCategoryByName(
        business.businessId,
        createCategoryDto.itemClass,
        categoryName,
        categoriesRepository,
      );
      if (existingCategory) {
        throw new ConflictException('La categoría ya está registrada');
      }

      const category = await categoriesRepository.save(
        categoriesRepository.create({
          businessId: business.businessId,
          itemClass: createCategoryDto.itemClass,
          categoryName,
        }),
      );

      return this.mapCategory(category);
    });
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const categoriesRepository = manager.getRepository(CategoryEntity);
      const category = await this.getCategoryOrThrow(
        business.businessId,
        categoryId,
        manager,
      );

      if (updateCategoryDto.categoryName) {
        const categoryName = updateCategoryDto.categoryName.trim();
        const existingCategory = await this.findCategoryByName(
          business.businessId,
          category.itemClass,
          categoryName,
          categoriesRepository,
        );

        if (
          existingCategory &&
          existingCategory.categoryId !== category.categoryId
        ) {
          throw new ConflictException('La categoría ya está registrada');
        }

        category.categoryName = categoryName;
      }

      return this.mapCategory(await categoriesRepository.save(category));
    });
  }

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    await this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      await this.getCategoryOrThrow(business.businessId, categoryId, manager);

      const linkedItemsCount = await manager.getRepository(ItemEntity).count({
        where: { businessId: business.businessId, categoryId },
      });

      if (linkedItemsCount > 0) {
        throw new ConflictException(
          'No se puede eliminar la categoría porque está asignada a items',
        );
      }

      await manager.getRepository(CategoryEntity).delete({
        categoryId,
        businessId: business.businessId,
      });
    });
  }

  async getItems(userId: string): Promise<ItemResponse[]> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const items = await manager.getRepository(ItemEntity).find({
        where: { businessId: business.businessId },
        relations: {
          category: true,
          unit: true,
          product: true,
          service: true,
        },
        order: { createdAt: 'DESC' },
      });

      return items.map((item) => this.mapItem(item));
    });
  }

  async getItemById(userId: string, itemId: string): Promise<ItemResponse> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const item = await this.getItemOrThrow(business.businessId, itemId, manager);
      return this.mapItem(item);
    });
  }

  async createItem(
    userId: string,
    createItemDto: CreateItemDto,
  ): Promise<ItemResponse> {
    try {
      return await this.rlsContextService.runAsUser(userId, async (manager) => {
        const business = await this.getBusinessOrThrow(userId, manager);
        this.ensureItemSpecializationPayload(
          createItemDto.itemClass,
          createItemDto,
        );
        const itemsRepository = manager.getRepository(ItemEntity);
        const productsRepository = manager.getRepository(ProductEntity);
        const servicesRepository = manager.getRepository(ServiceEntity);

        const [category, unit] = await Promise.all([
          this.getCategoryForItemOrThrow(
            manager,
            business.businessId,
            createItemDto.itemClass,
            createItemDto.categoryId,
          ),
          this.getUnitForItemOrThrow(
            manager,
            business.businessId,
            createItemDto.itemClass,
            createItemDto.unitId,
          ),
        ]);

        const item = await itemsRepository.save(
          itemsRepository.create({
            businessId: business.businessId,
            itemClass: createItemDto.itemClass,
            categoryId: category.categoryId,
            unitId: unit.unitId,
            name: createItemDto.name.trim(),
            description: this.normalizeOptionalText(createItemDto.description),
            sku: this.normalizeOptionalText(createItemDto.sku),
            imageUrl: this.normalizeOptionalText(createItemDto.imageUrl),
            price: createItemDto.price,
          }),
        );

        if (createItemDto.itemClass === ItemClass.Product) {
          await productsRepository.save(
            productsRepository.create({
              itemId: item.itemId,
              businessId: business.businessId,
              itemClass: ItemClass.Product,
              stock: createItemDto.stock ?? 0,
            }),
          );
        } else {
          await servicesRepository.save(
            servicesRepository.create({
              itemId: item.itemId,
              businessId: business.businessId,
              itemClass: ItemClass.Service,
            }),
          );
        }

        return this.mapItem(
          await this.getItemOrThrow(business.businessId, item.itemId, manager),
        );
      });
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException(
          'El SKU o el código de referencia ya se encuentran registrados',
        );
      }

      throw error;
    }
  }

  async updateItem(
    userId: string,
    itemId: string,
    updateItemDto: UpdateItemDto,
  ): Promise<ItemResponse> {
    try {
      return await this.rlsContextService.runAsUser(userId, async (manager) => {
        const business = await this.getBusinessOrThrow(userId, manager);
        const itemsRepository = manager.getRepository(ItemEntity);
        const productsRepository = manager.getRepository(ProductEntity);
        const item = await this.getItemOrThrow(business.businessId, itemId, manager);

        this.ensureItemSpecializationPayload(item.itemClass, updateItemDto);

        if (updateItemDto.name !== undefined) {
          item.name = updateItemDto.name.trim();
        }
        if (updateItemDto.description !== undefined) {
          item.description = this.normalizeOptionalText(updateItemDto.description);
        }
        if (updateItemDto.sku !== undefined) {
          item.sku = this.normalizeOptionalText(updateItemDto.sku);
        }
        if (updateItemDto.imageUrl !== undefined) {
          item.imageUrl = this.normalizeOptionalText(updateItemDto.imageUrl);
        }
        if (updateItemDto.price !== undefined) {
          item.price = updateItemDto.price;
        }
        if (updateItemDto.categoryId !== undefined) {
          const category = await this.getCategoryForItemOrThrow(
            manager,
            business.businessId,
            item.itemClass,
            updateItemDto.categoryId,
          );
          item.categoryId = category.categoryId;
        }
        if (updateItemDto.unitId !== undefined) {
          const unit = await this.getUnitForItemOrThrow(
            manager,
            business.businessId,
            item.itemClass,
            updateItemDto.unitId,
          );
          item.unitId = unit.unitId;
        }

        await itemsRepository.save(item);

        if (item.itemClass === ItemClass.Product) {
          const product = await productsRepository.findOne({
            where: { itemId, businessId: business.businessId },
          });

          if (!product) {
            throw new NotFoundException('Producto no encontrado');
          }

          if (updateItemDto.stock !== undefined) {
            product.stock = updateItemDto.stock;
          }

          await productsRepository.save(product);
        }

        return this.mapItem(
          await this.getItemOrThrow(business.businessId, itemId, manager),
        );
      });
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException(
          'El SKU o el código de referencia ya se encuentran registrados',
        );
      }

      throw error;
    }
  }

  async deleteItem(userId: string, itemId: string): Promise<void> {
    await this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      await this.getItemOrThrow(business.businessId, itemId, manager);
      await manager.getRepository(ItemEntity).delete({
        itemId,
        businessId: business.businessId,
      });
    });
  }

  private async getBusinessOrThrow(
    userId: string,
    manager: EntityManager,
  ): Promise<Business> {
    const business = await manager.getRepository(Business).findOne({
      where: { userId },
    });

    if (!business) {
      throw new BadRequestException('Business profile is not configured');
    }

    await this.ensureCatalogModuleEnabled(business.businessId, manager);

    return business;
  }

  private async ensureCatalogModuleEnabled(
    businessId: string,
    manager: EntityManager,
  ): Promise<void> {
    const catalogModule = await manager.getRepository(BusinessModule).findOne({
      where: {
        businessId,
        status: BusinessModuleStatus.Enabled,
        module: { code: 'catalogo' },
      },
      relations: { module: true },
    });

    if (!catalogModule) {
      throw new ForbiddenException(
        'The catalogo module is not enabled for this business',
      );
    }
  }

  private async getUnitOrThrow(
    businessId: string,
    unitId: string,
    manager?: EntityManager,
  ): Promise<UnitEntity> {
    const unitsRepository =
      manager?.getRepository(UnitEntity) ?? this.unitsRepository;
    const unit = await unitsRepository.findOne({
      where: { businessId, unitId },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  private async getCategoryOrThrow(
    businessId: string,
    categoryId: string,
    manager?: EntityManager,
  ): Promise<CategoryEntity> {
    const categoriesRepository =
      manager?.getRepository(CategoryEntity) ?? this.categoriesRepository;
    const category = await categoriesRepository.findOne({
      where: { businessId, categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async getItemOrThrow(
    businessId: string,
    itemId: string,
    manager?: EntityManager,
  ): Promise<ItemEntity> {
    const itemsRepository =
      manager?.getRepository(ItemEntity) ?? this.itemsRepository;
    const item = await itemsRepository.findOne({
      where: { businessId, itemId },
      relations: {
        category: true,
        unit: true,
        product: true,
        service: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return item;
  }

  private async getUnitForItemOrThrow(
    manager: EntityManager,
    businessId: string,
    itemClass: ItemClass,
    unitId: string,
  ) {
    const unitsRepository = manager.getRepository(UnitEntity);
    const unit = await unitsRepository.findOne({
      where: { businessId, itemClass, unitId },
    });

    if (!unit) {
      throw new BadRequestException(
        'La unidad seleccionada no pertenece al negocio o al tipo de item',
      );
    }

    return unit;
  }

  private async getCategoryForItemOrThrow(
    manager: EntityManager,
    businessId: string,
    itemClass: ItemClass,
    categoryId: string,
  ) {
    const categoriesRepository = manager.getRepository(CategoryEntity);
    const category = await categoriesRepository.findOne({
      where: { businessId, itemClass, categoryId },
    });

    if (!category) {
      throw new BadRequestException(
        'La categoría seleccionada no pertenece al negocio o al tipo de item',
      );
    }

    return category;
  }

  private ensureItemSpecializationPayload(
    itemClass: ItemClass,
    payload: { stock?: number },
  ) {
    if (itemClass === ItemClass.Service && payload.stock !== undefined) {
      throw new BadRequestException(
        'Los servicios no aceptan stock en este flujo',
      );
    }
  }

  private findUnitByName(
    businessId: string,
    itemClass: ItemClass,
    unitName: string,
    repository?: Repository<UnitEntity>,
  ) {
    const unitsRepository = repository ?? this.unitsRepository;
    return unitsRepository.findOne({
      where: { businessId, itemClass, unitName: unitName.trim() },
    });
  }

  private findCategoryByName(
    businessId: string,
    itemClass: ItemClass,
    categoryName: string,
    repository?: Repository<CategoryEntity>,
  ) {
    const categoriesRepository = repository ?? this.categoriesRepository;
    return categoriesRepository.findOne({
      where: { businessId, itemClass, categoryName: categoryName.trim() },
    });
  }

  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | null {
    const normalizedValue = value?.trim();
    return normalizedValue ? normalizedValue : null;
  }

  private mapUnit(unit: UnitEntity): UnitResponse {
    return {
      unitId: unit.unitId,
      businessId: unit.businessId,
      itemClass: unit.itemClass,
      unitName: unit.unitName,
      createdAt: unit.createdAt.toISOString(),
      updatedAt: unit.updatedAt.toISOString(),
    };
  }

  private mapCategory(category: CategoryEntity): CategoryResponse {
    return {
      categoryId: category.categoryId,
      businessId: category.businessId,
      itemClass: category.itemClass,
      categoryName: category.categoryName,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  private mapItem(item: ItemEntity): ItemResponse {
    return {
      id: item.itemId,
      businessId: item.businessId,
      itemClass: item.itemClass,
      name: item.name,
      description: item.description,
      sku: item.sku,
      referenceCode: item.referenceCode,
      imageUrl: item.imageUrl,
      price: item.price,
      category: {
        id: item.category.categoryId,
        name: item.category.categoryName,
        itemClass: item.category.itemClass,
      },
      unit: {
        id: item.unit.unitId,
        name: item.unit.unitName,
        itemClass: item.unit.itemClass,
      },
      stock: item.itemClass === ItemClass.Product ? item.product?.stock ?? 0 : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private isUniqueViolation(error: {
    driverError?: { code?: string };
  }): boolean {
    return error.driverError?.code === '23505';
  }
}
