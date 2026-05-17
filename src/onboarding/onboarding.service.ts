import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthStateResponse } from '../auth/types/auth-state-response.type';
import { type UserSessionState, UsersService } from '../users/users.service';
import { UpdateOnboardingModulesDto } from './dto/update-onboarding-modules.dto';
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

  async completeModules(
    userId: string,
    updateOnboardingModulesDto: UpdateOnboardingModulesDto,
  ): Promise<AuthStateResponse> {
    const user = await this.usersService.completeOnboardingModules(
      userId,
      updateOnboardingModulesDto.selectedModuleIds,
    );

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
