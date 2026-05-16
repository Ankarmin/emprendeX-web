import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'health', version: '1' })
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'emprende-x-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
