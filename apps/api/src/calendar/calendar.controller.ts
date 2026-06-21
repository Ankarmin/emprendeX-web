import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { CalendarService } from './calendar.service';

@ApiTags('Calendario')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'calendario', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @ApiOperation({ summary: 'Listar eventos', description: 'Lista los eventos del calendario del negocio.' })
  @ApiResponse({ status: 200 })
  @Get('events')
  listEvents(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.calendarService.listEvents(currentUser.id);
  }
}
