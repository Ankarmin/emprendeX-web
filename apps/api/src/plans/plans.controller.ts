import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { PlansService } from './plans.service';

@ApiTags('Planes')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'planes', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @ApiOperation({ summary: 'Listar planes', description: 'Lista todos los planes de suscripción disponibles.' })
  @ApiResponse({ status: 200 })
  @Get()
  list() {
    return this.plansService.list();
  }
}
