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
import { BusinessModuleStatus, UserStatus } from '../database/database.enums';
import { FeatureModuleEntity } from '../modules/entities/feature-module.entity';
import { PublicUser } from './types/public-user.type';
import { User } from './entities/user.entity';
import { AVAILABLE_MODULE_IDS } from './users.constants';

type SeedUserInput = {
  email: string;
  password: string;
};

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
        order: { createdAt: 'ASC' },
      });

      if (existingBusiness) {
        existingBusiness.businessName = businessName.trim();
        existingBusiness.industry = businessCategory.trim();
        await businessesRepository.save(existingBusiness);
        return;
      }

      const business = businessesRepository.create({
        userId,
        businessName: businessName.trim(),
        industry: businessCategory.trim(),
      });

      await businessesRepository.save(business);
    });

    return this.loadSessionState(userId);
  }

  async completeOnboardingModules(
    userId: string,
    enabledModuleIds: (typeof AVAILABLE_MODULE_IDS)[number][],
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
      const businessModulesRepository = manager.getRepository(BusinessModule);

      await businessModulesRepository.delete({
        businessId: business.businessId,
      });

      const businessModules = modules.map((module) =>
        businessModulesRepository.create({
          businessId: business.businessId,
          moduleId: module.moduleId,
          status: BusinessModuleStatus.Enabled,
        }),
      );

      await businessModulesRepository.save(businessModules);
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
    const businessModulesRepository =
      manager?.getRepository(BusinessModule) ?? this.businessModulesRepository;

    const user = await usersRepository.findOne({
      where: { userId },
    });

    if (!user) {
      return null;
    }

    const business = await this.findPrimaryBusinessByUserId(userId, manager);
    const enabledModuleIds = business
      ? await this.loadEnabledModuleIds(
          business.businessId,
          businessModulesRepository,
        )
      : [];

    return {
      id: user.userId,
      firstNames: user.firstNames,
      lastNames: user.lastNames,
      email: user.email,
      phone: user.phone,
      status: user.status,
      enabledModuleIds,
      businessProfile: {
        id: business?.businessId ?? null,
        name: business?.businessName ?? null,
        category: business?.industry ?? null,
      },
    };
  }

  private async findPrimaryBusinessByUserId(
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

  private async loadEnabledModuleIds(
    businessId: string,
    businessModulesRepository: Repository<BusinessModule>,
  ): Promise<string[]> {
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
      .filter((moduleId): moduleId is (typeof AVAILABLE_MODULE_IDS)[number] =>
        AVAILABLE_MODULE_IDS.includes(
          moduleId as (typeof AVAILABLE_MODULE_IDS)[number],
        ),
      );
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
