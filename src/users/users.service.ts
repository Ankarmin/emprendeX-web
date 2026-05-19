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
  SubscriptionStatus,
  UserStatus,
} from '../database/database.enums';
import { FeatureModuleEntity } from '../modules/entities/feature-module.entity';
import { PublicUser } from './types/public-user.type';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from './entities/user.entity';
import {
  AVAILABLE_MODULE_IDS,
  DEFAULT_ENABLED_MODULE_IDS,
} from './users.constants';

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
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Business)
    private readonly businessesRepository: Repository<Business>,
    @InjectRepository(BusinessModule)
    private readonly businessModulesRepository: Repository<BusinessModule>,
    @InjectRepository(FeatureModuleEntity)
    private readonly modulesRepository: Repository<FeatureModuleEntity>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
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
          businessCategory: businessCategory.trim(),
        });

        await businessesRepository.save(business);

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
      });

      if (existingBusiness) {
        existingBusiness.businessName = businessName.trim();
        existingBusiness.businessCategory = businessCategory.trim();
        await businessesRepository.save(existingBusiness);
        const enabledModuleIds = await this.loadEnabledModuleIds(
          existingBusiness.businessId,
          manager.getRepository(BusinessModule),
        );
        if (enabledModuleIds.length > 0) {
          await this.syncBusinessModulesForBusiness(
            existingBusiness.businessId,
            enabledModuleIds,
            manager,
          );
        }
        return;
      }

      const business = businessesRepository.create({
        userId,
        businessName: businessName.trim(),
        businessCategory: businessCategory.trim(),
      });

      await businessesRepository.save(business);
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

  async ensureDefaultModulesForUser(
    userId: string,
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

    await this.dataSource.transaction(async (manager) => {
      await this.syncBusinessModulesForBusiness(
        business.businessId,
        DEFAULT_ENABLED_MODULE_IDS,
        manager,
      );
    });

    return this.loadSessionState(userId);
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
        category: business?.businessCategory ?? null,
      },
    };
  }

  private async findPrimaryBusinessByUserIdInternal(
    userId: string,
    manager?: EntityManager,
  ): Promise<Business | null> {
    const businessesRepository =
      manager?.getRepository(Business) ?? this.businessesRepository;

    return businessesRepository.findOne({ where: { userId } });
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
        status: enabledModuleIdSet.has(module.code as AvailableModuleId)
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
      .map((businessModule) => businessModule.module.code)
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

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isUniqueViolation(error: {
    driverError?: { code?: string };
  }): boolean {
    return error.driverError?.code === '23505';
  }
}
