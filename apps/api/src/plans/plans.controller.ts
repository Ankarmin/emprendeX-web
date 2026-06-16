import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { PlansService } from './plans.service';

@Controller({ path: 'planes', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  list() {
    return this.plansService.list();
  }
}
