import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PublicUser } from './types/public-user.type';

type SeedUserInput = {
  email: string;
  password: string;
};

type CreateUserInput = {
  email: string;
  password: string;
  businessName: string;
  businessCategory: string;
  currencyCode: string;
};

type UpdateBusinessProfileInput = {
  businessName: string;
  businessCategory: string;
  currencyCode: string;
};

type PublicUserSource = Pick<
  User,
  | 'id'
  | 'email'
  | 'onboardingCompleted'
  | 'enabledModuleIds'
  | 'businessName'
  | 'businessCategory'
  | 'currencyCode'
>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        email: this.normalizeEmail(email),
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        businessName: true,
        businessCategory: true,
        currencyCode: true,
        onboardingCompleted: true,
        enabledModuleIds: true,
      },
    });
  }

  async ensureSeedUser({ email, password }: SeedUserInput): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return;
    }

    const passwordHash = await hash(password, 12);

    const user = this.usersRepository.create({
      email: normalizedEmail,
      passwordHash,
      onboardingCompleted: false,
    });

    await this.usersRepository.save(user);
  }

  async create({
    email,
    password,
    businessName,
    businessCategory,
    currencyCode,
  }: CreateUserInput): Promise<User> {
    const normalizedEmail = this.normalizeEmail(email);
    const passwordHash = await hash(password, 12);

    const user = this.usersRepository.create({
      email: normalizedEmail,
      passwordHash,
      businessName: businessName.trim(),
      businessCategory: businessCategory.trim(),
      currencyCode: currencyCode.trim().toUpperCase(),
      onboardingCompleted: false,
      enabledModuleIds: [],
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  async updateBusinessProfile(
    userId: string,
    {
      businessName,
      businessCategory,
      currencyCode,
    }: UpdateBusinessProfileInput,
  ): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      return null;
    }

    user.businessName = businessName.trim();
    user.businessCategory = businessCategory.trim();
    user.currencyCode = currencyCode.trim().toUpperCase();

    return this.usersRepository.save(user);
  }

  async completeOnboardingModules(
    userId: string,
    enabledModuleIds: string[],
  ): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      return null;
    }

    user.enabledModuleIds = enabledModuleIds;
    user.onboardingCompleted = true;

    return this.usersRepository.save(user);
  }

  toPublicUser(user: PublicUserSource): PublicUser {
    return {
      id: user.id,
      email: user.email,
      onboardingCompleted: user.onboardingCompleted,
      enabledModuleIds: user.enabledModuleIds,
      businessProfile: {
        name: user.businessName,
        category: user.businessCategory,
        currencyCode: user.currencyCode,
      },
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isUniqueViolation(error: {
    driverError?: { code?: string };
  }): boolean {
    const driverError = error.driverError;

    return driverError?.code === '23505';
  }
}
