import { Controller, Get, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { CalendarService } from './calendar.service';

@Controller({ path: 'calendario', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  listEvents(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.calendarService.listEvents(currentUser.id);
  }
}
