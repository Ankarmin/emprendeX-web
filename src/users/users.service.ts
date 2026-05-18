import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import {
  DataSource,
  EntityManager,
  In,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { BusinessModule } from '../businesses/entities/business-module.entity';
import { CategoryEntity } from '../catalog/entities/category.entity';
import { UnitEntity } from '../catalog/entities/unit.entity';
import {
  BusinessModuleStatus,
  PlanPeriod,
  UserStatus,
} from '../database/database.enums';
import { FeatureModuleEntity } from '../modules/entities/feature-module.entity';
import { PlanPrice } from '../plans/entities/plan-price.entity';
import { PublicUser } from './types/public-user.type';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from './entities/user.entity';
import {
  AVAILABLE_MODULE_IDS,
  DEFAULT_CATEGORY_SEEDS,
  DEFAULT_UNIT_SEEDS,
} from './users.constants';

type SeedUserInput = {
  email: string;
  password: string;
};

type SeedAccountInput = {
  email: string;
  password: string;
  firstNames: string;
  lastNames: string;
  phone: string;
  businessName: string;
  businessCategory: string;
  enabledModuleIds: (typeof AVAILABLE_MODULE_IDS)[number][];
} & (
  | {
      planName: 'Basic';
      planPeriod?: never;
    }
  | {
      planName: 'Pro';
      planPeriod: 'Monthly' | 'Yearly';
    }
);

type AuthUserRecord = {
  id: string;
  email: string;
  passwordHash: string | null;
};

type CreateUserInput = {
  firstNames: string;
  lastNames: string;
  phone: string;
  email: string;
  password: string;
  businessName: string;
  businessCategory: string;
};

type AvailableModuleId = (typeof AVAILABLE_MODULE_IDS)[number];

type UpdateBusinessProfileInput = {
  businessName: string;
  businessCategory: string;
};

export type UserSessionState = {
  id: string;
  firstNames: string;
  lastNames: string;
  email: string;
  phone: string;
  status: UserStatus;
  enabledModuleIds: string[];
  activeSubscription: {
    id: string;
    planName: string;
    period: 'Monthly' | 'Yearly';
    price: string;
    endsAt: string;
    isActive: boolean;
    isPremium: boolean;
  } | null;
  businessProfile: {
    id: string | null;
    name: string | null;
    category: string | null;
  };
};

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
    @InjectRepository(BusinessModule)
    private readonly businessModulesRepository: Repository<BusinessModule>,
    @InjectRepository(FeatureModuleEntity)
    private readonly modulesRepository: Repository<FeatureModuleEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitsRepository: Repository<UnitEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoriesRepository: Repository<CategoryEntity>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(PlanPrice)
    private readonly planPricesRepository: Repository<PlanPrice>,
  ) {}

  async findById(id: string): Promise<UserSessionState | null> {
    return this.loadSessionState(id);
  }

  async findByEmailWithPassword(email: string): Promise<AuthUserRecord | null> {
    const user = await this.usersRepository.findOne({
      where: { email: this.normalizeEmail(email) },
      select: {
        userId: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.userId,
      email: user.email,
      passwordHash: user.passwordHash,
    };
  }

  async ensureSeedUser({ email, password }: SeedUserInput): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: this.normalizeEmail(email) },
      select: { userId: true },
    });

    if (existingUser) {
      return;
    }

    await this.create({
      firstNames: 'Admin',
      lastNames: 'EmprendeX',
      phone: '999999999',
      email,
      password,
      businessName: 'Negocio Demo',
      businessCategory: 'General',
    });
  }

  async ensureDemoAccount({
    email,
    password,
    firstNames,
    lastNames,
    phone,
    businessName,
    businessCategory,
    planName,
    planPeriod,
    enabledModuleIds,
  }: SeedAccountInput): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
      select: { userId: true },
    });

    if (existingUser) {
      await this.dataSource.transaction(async (manager) => {
        const usersRepository = manager.getRepository(User);

        await usersRepository.update(
          { userId: existingUser.userId },
          {
            firstNames: firstNames.trim(),
            lastNames: lastNames.trim(),
            phone: phone.trim(),
            status: UserStatus.Active,
          },
        );
      });

      await this.updateBusinessProfile(existingUser.userId, {
        businessName,
        businessCategory,
      });
      await this.ensureSubscriptionForUser(existingUser.userId, {
        planName,
        planPeriod,
      });
      await this.completeOnboardingModules(
        existingUser.userId,
        enabledModuleIds,
      );
      return;
    }

    const createdUser = await this.create({
      firstNames,
      lastNames,
      phone,
      email: normalizedEmail,
      password,
      businessName,
      businessCategory,
    });

    await this.ensureSubscriptionForUser(createdUser.id, {
      planName,
      planPeriod,
    });

    await this.completeOnboardingModules(createdUser.id, enabledModuleIds);
  }

  async create({
    firstNames,
    lastNames,
    phone,
    email,
    password,
    businessName,
    businessCategory,
  }: CreateUserInput): Promise<UserSessionState> {
    const normalizedEmail = this.normalizeEmail(email);
    const passwordHash = await hash(password, 12);

    try {
      const createdUser = await this.dataSource.transaction(async (manager) => {
        const usersRepository = manager.getRepository(User);
        const businessesRepository = manager.getRepository(Business);

        const user = usersRepository.create({
          firstNames: firstNames.trim(),
          lastNames: lastNames.trim(),
          phone: phone.trim(),
          email: normalizedEmail,
          passwordHash,
          status: UserStatus.Active,
        });

        const savedUser = await usersRepository.save(user);

        const business = businessesRepository.create({
          userId: savedUser.userId,
          businessName: businessName.trim(),
          industry: businessCategory.trim(),
        });

        const savedBusiness = await businessesRepository.save(business);

        await this.ensureProductosServiciosDefaultsForBusiness(
          savedBusiness.businessId,
          manager,
        );
        await this.syncBusinessModulesForBusiness(
          savedBusiness.businessId,
          [],
          manager,
        );

        return savedUser;
      });

      const sessionState = await this.loadSessionState(createdUser.userId);

      if (!sessionState) {
        throw new Error('Failed to load created user session state.');
      }

      return sessionState;
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  async updateBusinessProfile(
    userId: string,
    { businessName, businessCategory }: UpdateBusinessProfileInput,
  ): Promise<UserSessionState | null> {
    const user = await this.usersRepository.findOne({ where: { userId } });

    if (!user) {
      return null;
    }

    await this.dataSource.transaction(async (manager) => {
      const businessesRepository = manager.getRepository(Business);
      const existingBusiness = await businessesRepository.findOne({
        where: { userId },
        order: { createdAt: 'ASC' },
      });

      if (existingBusiness) {
        existingBusiness.businessName = businessName.trim();
        existingBusiness.industry = businessCategory.trim();
        await businessesRepository.save(existingBusiness);
        await this.ensureProductosServiciosDefaultsForBusiness(
          existingBusiness.businessId,
          manager,
        );
        const enabledModuleIds = await this.loadEnabledModuleIds(
          existingBusiness.businessId,
          manager.getRepository(BusinessModule),
        );
        await this.syncBusinessModulesForBusiness(
          existingBusiness.businessId,
          enabledModuleIds,
          manager,
        );
        return;
      }

      const business = businessesRepository.create({
        userId,
        businessName: businessName.trim(),
        industry: businessCategory.trim(),
      });

      const savedBusiness = await businessesRepository.save(business);

      await this.ensureProductosServiciosDefaultsForBusiness(
        savedBusiness.businessId,
        manager,
      );
      await this.syncBusinessModulesForBusiness(
        savedBusiness.businessId,
        [],
        manager,
      );
    });

    return this.loadSessionState(userId);
  }

  async completeOnboardingModules(
    userId: string,
    enabledModuleIds: AvailableModuleId[],
  ): Promise<UserSessionState | null> {
    const user = await this.usersRepository.findOne({ where: { userId } });

    if (!user) {
      return null;
    }

    const business = await this.findPrimaryBusinessByUserId(userId);

    if (!business) {
      throw new BadRequestException(
        'Business profile must be configured first',
      );
    }

    const uniqueModuleNames = Array.from(new Set(enabledModuleIds));
    const modules = await this.modulesRepository.find({
      where: {
        moduleName: In(uniqueModuleNames),
      },
    });

    if (modules.length !== uniqueModuleNames.length) {
      throw new BadRequestException(
        'One or more selected modules are not available',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await this.syncBusinessModulesForBusiness(
        business.businessId,
        modules.map((module) => module.moduleName as AvailableModuleId),
        manager,
      );
    });

    return this.loadSessionState(userId);
  }

  toPublicUser(user: UserSessionState): PublicUser {
    return {
      id: user.id,
      firstNames: user.firstNames,
      lastNames: user.lastNames,
      email: user.email,
      phone: user.phone,
      status: user.status,
      onboardingCompleted: !this.requiresOnboarding(user),
      enabledModuleIds: user.enabledModuleIds,
      activeSubscription: user.activeSubscription,
      businessProfile: user.businessProfile,
    };
  }

  requiresOnboarding(user: UserSessionState): boolean {
    const hasBusinessProfile = Boolean(
      user.businessProfile.name && user.businessProfile.category,
    );

    return !hasBusinessProfile || user.enabledModuleIds.length === 0;
  }

  async ensureProductosServiciosDefaultsForAllBusinesses(): Promise<void> {
    const businesses = await this.businessesRepository.find({
      select: {
        businessId: true,
      },
    });

    for (const business of businesses) {
      await this.ensureProductosServiciosDefaultsForBusiness(
        business.businessId,
      );
    }
  }

  async findPrimaryBusinessByUserId(userId: string): Promise<Business | null> {
    return this.findPrimaryBusinessByUserIdInternal(userId);
  }

  private async loadSessionState(
    userId: string,
    manager?: EntityManager,
  ): Promise<UserSessionState | null> {
    const usersRepository =
      manager?.getRepository(User) ?? this.usersRepository;
    const businessModulesRepository =
      manager?.getRepository(BusinessModule) ?? this.businessModulesRepository;

    const user = await usersRepository.findOne({
      where: { userId },
    });

    if (!user) {
      return null;
    }

    const business = await this.findPrimaryBusinessByUserIdInternal(
      userId,
      manager,
    );
    const enabledModuleIds = business
      ? await this.loadEnabledModuleIds(
          business.businessId,
          businessModulesRepository,
        )
      : [];
    const activeSubscription = await this.loadActiveSubscription(
      userId,
      manager,
    );

    return {
      id: user.userId,
      firstNames: user.firstNames,
      lastNames: user.lastNames,
      email: user.email,
      phone: user.phone,
      status: user.status,
      enabledModuleIds,
      activeSubscription,
      businessProfile: {
        id: business?.businessId ?? null,
        name: business?.businessName ?? null,
        category: business?.industry ?? null,
      },
    };
  }

  private async findPrimaryBusinessByUserIdInternal(
    userId: string,
    manager?: EntityManager,
  ): Promise<Business | null> {
    const businessesRepository =
      manager?.getRepository(Business) ?? this.businessesRepository;

    const businesses = await businessesRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
      take: 1,
    });

    return businesses[0] ?? null;
  }

  private async ensureProductosServiciosDefaultsForBusiness(
    businessId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const unitsRepository =
      manager?.getRepository(UnitEntity) ?? this.unitsRepository;
    const categoriesRepository =
      manager?.getRepository(CategoryEntity) ?? this.categoriesRepository;

    const existingUnits = await unitsRepository.find({
      where: { businessId },
      select: { unitName: true },
    });
    const existingUnitNames = new Set(
      existingUnits.map((unit) => unit.unitName.trim().toLowerCase()),
    );

    const unitsToCreate = DEFAULT_UNIT_SEEDS.filter(
      (unit) => !existingUnitNames.has(unit.unitName.trim().toLowerCase()),
    ).map((unit) =>
      unitsRepository.create({
        businessId,
        unitName: unit.unitName,
        abbreviation: unit.abbreviation,
      }),
    );

    if (unitsToCreate.length > 0) {
      await unitsRepository.save(unitsToCreate);
    }

    const existingCategories = await categoriesRepository.find({
      where: { businessId },
      select: { categoryName: true },
    });
    const existingCategoryNames = new Set(
      existingCategories.map((category) =>
        category.categoryName.trim().toLowerCase(),
      ),
    );

    const categoriesToCreate = DEFAULT_CATEGORY_SEEDS.filter(
      (category) =>
        !existingCategoryNames.has(category.categoryName.trim().toLowerCase()),
    ).map((category) =>
      categoriesRepository.create({
        businessId,
        categoryName: category.categoryName,
      }),
    );

    if (categoriesToCreate.length > 0) {
      await categoriesRepository.save(categoriesToCreate);
    }
  }

  private async syncBusinessModulesForBusiness(
    businessId: string,
    enabledModuleIds: AvailableModuleId[],
    manager?: EntityManager,
  ): Promise<void> {
    const modulesRepository =
      manager?.getRepository(FeatureModuleEntity) ?? this.modulesRepository;
    const businessModulesRepository =
      manager?.getRepository(BusinessModule) ?? this.businessModulesRepository;

    const availableModules = await modulesRepository.find();
    const enabledModuleIdSet = new Set(enabledModuleIds);

    await businessModulesRepository.delete({ businessId });

    if (availableModules.length === 0) {
      return;
    }

    const businessModules = availableModules.map((module) =>
      businessModulesRepository.create({
        businessId,
        moduleId: module.moduleId,
        status: enabledModuleIdSet.has(module.moduleName as AvailableModuleId)
          ? BusinessModuleStatus.Enabled
          : BusinessModuleStatus.Blocked,
      }),
    );

    await businessModulesRepository.save(businessModules);
  }

  private async loadEnabledModuleIds(
    businessId: string,
    businessModulesRepository: Repository<BusinessModule>,
  ): Promise<AvailableModuleId[]> {
    const businessModules = await businessModulesRepository.find({
      where: {
        businessId,
        status: BusinessModuleStatus.Enabled,
      },
      relations: {
        module: true,
      },
    });

    return businessModules
      .map((businessModule) => businessModule.module.moduleName)
      .filter((moduleId): moduleId is AvailableModuleId =>
        AVAILABLE_MODULE_IDS.includes(moduleId as AvailableModuleId),
      );
  }

  private async loadActiveSubscription(
    userId: string,
    manager?: EntityManager,
  ): Promise<UserSessionState['activeSubscription']> {
    const subscriptionsRepository =
      manager?.getRepository(Subscription) ?? this.subscriptionsRepository;

    const subscription = await subscriptionsRepository.findOne({
      where: {
        userId,
        status: true,
      },
      relations: {
        planPrice: {
          plan: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!subscription) {
      return null;
    }

    return {
      id: subscription.subscriptionId,
      planName: subscription.planPrice.plan.name,
      period: subscription.planPrice.period,
      price: subscription.planPrice.price,
      endsAt: subscription.endDate.toISOString(),
      isActive: subscription.status,
      isPremium:
        subscription.planPrice.plan.name.trim().toLowerCase() === 'pro',
    };
  }

  private async ensureSubscriptionForUser(
    userId: string,
    planSelection: Pick<SeedAccountInput, 'planName' | 'planPeriod'>,
  ): Promise<void> {
    if (planSelection.planName === 'Basic') {
      await this.subscriptionsRepository.delete({ userId });
      return;
    }

    const { planPeriod } = planSelection;

    if (!planPeriod) {
      throw new Error('Plan period is required for Pro subscriptions');
    }

    const planPrice = await this.planPricesRepository.findOne({
      where: {
        period:
          planPeriod === 'Yearly' ? PlanPeriod.Yearly : PlanPeriod.Monthly,
        plan: {
          name: planSelection.planName,
        },
      },
      relations: {
        plan: true,
      },
    });

    if (!planPrice) {
      throw new Error(
        `Plan price not found for ${planSelection.planName} ${planSelection.planPeriod}`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const subscriptionsRepository = manager.getRepository(Subscription);

      await subscriptionsRepository.delete({ userId });

      const subscription = subscriptionsRepository.create({
        planPriceId: planPrice.planPriceId,
        userId,
        startDate: new Date(),
        endDate: this.buildSubscriptionEndDate(planPeriod),
        status: true,
      });

      await subscriptionsRepository.save(subscription);
    });
  }

  private buildSubscriptionEndDate(period: 'Monthly' | 'Yearly'): Date {
    const date = new Date();

    if (period === 'Yearly') {
      date.setFullYear(date.getFullYear() + 1);
      return date;
    }

    date.setMonth(date.getMonth() + 1);
    return date;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isUniqueViolation(error: {
    driverError?: { code?: string };
  }): boolean {
    return error.driverError?.code === '23505';
  }
}
