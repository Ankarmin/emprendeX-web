import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { UpdateBusinessPreferencesDto } from './dto/update-business-preferences.dto';
import { BusinessPreferencesService } from './business-preferences.service';

@Controller({ path: 'business/preferences', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class BusinessPreferencesController {
  constructor(
    private readonly businessPreferencesService: BusinessPreferencesService,
  ) {}

  @Get()
  getMyPreferences(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.businessPreferencesService.getMyPreferences(currentUser.id);
  }

  @Patch()
  updateMyPreferences(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateBusinessPreferencesDto,
  ) {
    return this.businessPreferencesService.updateMyPreferences(
      currentUser.id,
      dto,
    );
  }
}
