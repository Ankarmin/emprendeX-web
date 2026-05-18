import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthStateResponse } from '../auth/types/auth-state-response.type';
import { type UserSessionState, UsersService } from '../users/users.service';
import { UpdateOnboardingSetupDto } from './dto/update-onboarding-setup.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly usersService: UsersService) {}

  async updateSetup(
    userId: string,
    updateOnboardingSetupDto: UpdateOnboardingSetupDto,
  ): Promise<AuthStateResponse> {
    const user = await this.usersService.updateBusinessProfile(userId, {
      businessName: updateOnboardingSetupDto.businessName,
      businessCategory: updateOnboardingSetupDto.businessCategory,
    });

    if (!user) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return this.buildAuthStateResponse(user);
  }

  async completeModules(userId: string): Promise<AuthStateResponse> {
    const user = await this.usersService.ensureDefaultModulesForUser(userId);

    if (!user) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return this.buildAuthStateResponse(user);
  }

  private buildAuthStateResponse(user: UserSessionState): AuthStateResponse {
    const publicUser = this.usersService.toPublicUser(user);

    return {
      requiresOnboarding: this.usersService.requiresOnboarding(user),
      user: publicUser,
    };
  }
}
