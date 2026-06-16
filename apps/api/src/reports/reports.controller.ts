import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { ReportsService } from './reports.service';

@Controller({ path: 'reportes', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  getOverview(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.reportsService.getOverview(currentUser.id);
  }

  @Get('kpis')
  getBusinessKpis(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('timezone') timezone = 'America/Lima',
  ) {
    return this.reportsService.getBusinessKpis(currentUser.id, timezone);
  }
}
