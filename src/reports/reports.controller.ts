import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller({ path: 'reportes', version: '1' })
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  getOverview(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.reportsService.getOverview(currentUser.id);
  }
}
