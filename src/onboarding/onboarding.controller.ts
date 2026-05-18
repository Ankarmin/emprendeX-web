import { Body, Controller, Patch, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UpdateOnboardingSetupDto } from './dto/update-onboarding-setup.dto';
import { OnboardingService } from './onboarding.service';

@Controller({ path: 'onboarding', version: '1' })
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Patch('setup')
  updateSetup(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateOnboardingSetupDto: UpdateOnboardingSetupDto,
  ) {
    return this.onboardingService.updateSetup(
      currentUser.id,
      updateOnboardingSetupDto,
    );
  }

  @Put('modules')
  completeModules(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.onboardingService.completeModules(currentUser.id);
  }
}
