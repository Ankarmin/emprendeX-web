import { Body, Controller, Patch, Put, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { UpdateOnboardingSetupDto } from './dto/update-onboarding-setup.dto';
import { OnboardingService } from './onboarding.service';

@ApiTags('Onboarding')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'onboarding', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @ApiOperation({
    summary: 'Configurar negocio',
    description:
      'Actualiza nombre y categoría del negocio durante el onboarding.',
  })
  @ApiResponse({ status: 200 })
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

  @ApiOperation({
    summary: 'Completar módulos',
    description: 'Marca los módulos de onboarding como completados.',
  })
  @ApiResponse({ status: 200, description: 'Módulos actualizados.' })
  @Put('modules')
  completeModules(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.onboardingService.completeModules(currentUser.id);
  }
}
