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
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { BusinessModule } from '../businesses/entities/business-module.entity';
import {
  BusinessModuleStatus,
  PlanPeriod,
  SubscriptionStatus,
  UserStatus,
} from '../database/database.enums';
import { FeatureModuleEntity } from '../modules/entities/feature-module.entity';
import { PlanPrice } from '../plans/entities/plan-price.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { normalizeDni } from '../common/utils/dni.util';
import {
  appendPublicCatalogSlugSuffix,
  normalizePublicCatalogSlug,
} from '../common/utils/public-catalog-slug.util';
import { RlsContextService } from '../database/rls/rls-context.service';
import { User } from './entities/user.entity';
import { PublicUser } from './types/public-user.type';
import {
  AVAILABLE_MODULE_IDS,
  DEFAULT_ENABLED_MODULE_IDS,
} from './users.constants';

type AuthUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
};

type CreateUserInput = {
  firstNames: string;
  lastNames: string;
  dni: string;
  phone: string;
  email: string;
  password: string;
  businessName: string;
  businessCategory: string;
};

type UpdateBusinessProfileInput = {
  businessName: string;
  businessCategory: string;
};

type UpdateOwnProfileInput = {
  firstNames: string;
  lastNames: string;
  businessName: string;
  businessCategory: string;
};

type AvailableModuleId = (typeof AVAILABLE_MODULE_IDS)[number];

export type UserSessionState = {
  id: string;
  firstNames: string;
  lastNames: string;
  dni: string;
  email: string;
  phone: string;
  status: UserStatus;
  enabledModuleIds: string[];
  activeSubscription: {
    id: string;
    planName: string;
    period: string;
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
    private readonly rlsContextService: RlsContextService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
    @InjectRepository(BusinessModule)
    private readonly businessModulesRepository: Repository<BusinessModule>,
    @InjectRepository(FeatureModuleEntity)
    private readonly modulesRepository: Repository<FeatureModuleEntity>,
    @InjectRepository(PlanPrice)
    private readonly planPricesRepository: Repository<PlanPrice>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
  ) {}

  async findById(id: string): Promise<UserSessionState | null> {
    return this.rlsContextService.runAsUser(id, (manager) =>
      this.loadSessionState(id, manager),
    );
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

  async create(input: CreateUserInput): Promise<UserSessionState> {
    const normalizedEmail = this.normalizeEmail(input.email);
    const normalizedDni = normalizeDni(input.dni);
    const normalizedPhone = input.phone.trim();
    const passwordHash = await hash(input.password, 12);

    try {
      const userId = await this.dataSource.transaction(async (manager) => {
        const usersRepository = manager.getRepository(User);
        const businessesRepository = manager.getRepository(Business);
        const subscriptionsRepository = manager.getRepository(Subscription);

        const user = await usersRepository.save(
          usersRepository.create({
            firstNames: input.firstNames.trim(),
            lastNames: input.lastNames.trim(),
            dni: normalizedDni,
            email: normalizedEmail,
            phone: normalizedPhone,
            passwordHash,
          }),
        );

        const business = await businessesRepository.save(
          businessesRepository.create({
            userId: user.userId,
            businessName: input.businessName.trim(),
            businessCategory: input.businessCategory.trim(),
            publicCatalogSlug: await this.generateUniquePublicCatalogSlug(
              input.businessName,
              businessesRepository,
            ),
            catalogIsPublic: true,
          }),
        );

        const defaultPlanPrice = await this.getDefaultPlanPrice(manager);
        const startDate = new Date();
        const endDate = this.addDays(startDate, 30);

        await subscriptionsRepository.save(
          subscriptionsRepository.create({
            userId: user.userId,
            planPriceId: defaultPlanPrice.planPriceId,
            startDate,
            endDate,
            status: SubscriptionStatus.Active,
          }),
        );

        await this.syncBusinessModulesForBusiness(
          business.businessId,
          DEFAULT_ENABLED_MODULE_IDS,
          manager,
        );

        return user.userId;
      });

      const sessionState = await this.loadSessionState(userId);

      if (!sessionState) {
        throw new Error('Failed to load created user session state');
      }

      return sessionState;
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException(this.getUniqueViolationMessage(error));
      }

      throw error;
    }
  }

  async updateBusinessProfile(
    userId: string,
    input: UpdateBusinessProfileInput,
  ): Promise<UserSessionState | null> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.findPrimaryBusinessByUserId(userId, manager);

      if (!business) {
        return null;
      }

      business.businessName = input.businessName.trim();
      business.businessCategory = input.businessCategory.trim();
      await manager.getRepository(Business).save(business);

      return this.loadSessionState(userId, manager);
    });
  }

  async updateOwnProfile(
    userId: string,
    input: UpdateOwnProfileInput,
  ): Promise<UserSessionState | null> {
    try {
      return this.rlsContextService.runAsUser(userId, async (manager) => {
        const usersRepository = manager.getRepository(User);
        const businessesRepository = manager.getRepository(Business);
        const user = await usersRepository.findOne({ where: { userId } });
        const business = await businessesRepository.findOne({
          where: { userId },
        });

        if (!user || !business) {
          return null;
        }

        user.firstNames = input.firstNames.trim();
        user.lastNames = input.lastNames.trim();
        business.businessName = input.businessName.trim();
        business.businessCategory = input.businessCategory.trim();

        await usersRepository.save(user);
        await businessesRepository.save(business);

        return this.loadSessionState(userId, manager);
      });
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException(this.getUniqueViolationMessage(error));
      }

      throw error;
    }
  }

  async ensureDefaultModulesForUser(
    userId: string,
  ): Promise<UserSessionState | null> {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.findPrimaryBusinessByUserId(userId, manager);

      if (!business) {
        return null;
      }

      await this.syncBusinessModulesForBusiness(
        business.businessId,
        DEFAULT_ENABLED_MODULE_IDS,
        manager,
      );

      return this.loadSessionState(userId, manager);
    });
  }

  async findPrimaryBusinessByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<Business | null> {
    const businessesRepository =
      manager?.getRepository(Business) ?? this.businessesRepository;
    return businessesRepository.findOne({ where: { userId } });
  }

  toPublicUser(user: UserSessionState): PublicUser {
    return {
      id: user.id,
      firstNames: user.firstNames,
      lastNames: user.lastNames,
      dni: user.dni,
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

  private async loadSessionState(
    userId: string,
    manager?: EntityManager,
  ): Promise<UserSessionState | null> {
    const usersRepository =
      manager?.getRepository(User) ?? this.usersRepository;
    const businessesRepository =
      manager?.getRepository(Business) ?? this.businessesRepository;
    const businessModulesRepository =
      manager?.getRepository(BusinessModule) ?? this.businessModulesRepository;
    const subscriptionsRepository =
      manager?.getRepository(Subscription) ?? this.subscriptionsRepository;

    const user = await usersRepository.findOne({ where: { userId } });

    if (!user) {
      return null;
    }

    const business = await businessesRepository.findOne({ where: { userId } });
    const enabledModuleIds = business
      ? await this.loadEnabledModuleIds(
          business.businessId,
          businessModulesRepository,
        )
      : [];
    const activeSubscription = await this.loadActiveSubscription(
      userId,
      subscriptionsRepository,
    );

    return {
      id: user.userId,
      firstNames: user.firstNames,
      lastNames: user.lastNames,
      dni: user.dni,
      email: user.email,
      phone: user.phone,
      status: UserStatus.Active,
      enabledModuleIds,
      activeSubscription,
      businessProfile: {
        id: business?.businessId ?? null,
        name: business?.businessName ?? null,
        category: business?.businessCategory ?? null,
      },
    };
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
      order: {
        createdAt: 'ASC',
      },
    });

    return businessModules
      .map((businessModule) => businessModule.module.code)
      .filter((code): code is AvailableModuleId =>
        AVAILABLE_MODULE_IDS.includes(code as AvailableModuleId),
      );
  }

  private async loadActiveSubscription(
    userId: string,
    subscriptionsRepository: Repository<Subscription>,
  ): Promise<UserSessionState['activeSubscription']> {
    const subscription = await subscriptionsRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.Active,
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
      isActive: subscription.status === SubscriptionStatus.Active,
      isPremium:
        subscription.planPrice.plan.name.trim().toLowerCase() === 'pro',
    };
  }

  private async syncBusinessModulesForBusiness(
    businessId: string,
    enabledModuleIds: AvailableModuleId[],
    manager: EntityManager,
  ): Promise<void> {
    const modulesRepository = manager.getRepository(FeatureModuleEntity);
    const businessModulesRepository = manager.getRepository(BusinessModule);
    const availableModules = await modulesRepository.find({
      order: { code: 'ASC' },
    });

    if (availableModules.length === 0) {
      throw new BadRequestException(
        'La tabla modules no tiene datos iniciales',
      );
    }

    const enabledModuleIdSet = new Set(enabledModuleIds);

    await businessModulesRepository.delete({ businessId });

    await businessModulesRepository.save(
      availableModules.map((module) =>
        businessModulesRepository.create({
          businessId,
          moduleId: module.moduleId,
          status: enabledModuleIdSet.has(module.code as AvailableModuleId)
            ? BusinessModuleStatus.Enabled
            : BusinessModuleStatus.Blocked,
        }),
      ),
    );
  }

  private async getDefaultPlanPrice(
    manager: EntityManager,
  ): Promise<PlanPrice> {
    const planPricesRepository = manager.getRepository(PlanPrice);
    const defaultPlanPrice = await planPricesRepository.findOne({
      where: {
        period: PlanPeriod.Monthly,
        isActive: true,
        plan: {
          name: 'Básico',
        },
      },
      relations: {
        plan: true,
      },
    });

    if (!defaultPlanPrice) {
      throw new BadRequestException(
        'No existe un plan mensual Básico activo para registrar usuarios',
      );
    }

    return defaultPlanPrice;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async generateUniquePublicCatalogSlug(
    businessName: string,
    businessesRepository: Repository<Business>,
  ): Promise<string> {
    const baseSlug = normalizePublicCatalogSlug(businessName);
    let candidate = baseSlug;
    let suffix = 2;

    while (
      await businessesRepository.findOne({
        where: { publicCatalogSlug: candidate },
        select: { businessId: true },
      })
    ) {
      candidate = appendPublicCatalogSlugSuffix(baseSlug, suffix);
      suffix += 1;
    }

    return candidate;
  }

  private isUniqueViolation(error: {
    driverError?: { code?: string };
  }): boolean {
    return error.driverError?.code === '23505';
  }

  private getUniqueViolationMessage(error: {
    driverError?: { constraint?: string };
  }): string {
    if (error.driverError?.constraint === 'uq_users_dni') {
      return 'El DNI ya se encuentra registrado';
    }

    return 'Email o telefono ya se encuentran registrados';
  }
}
