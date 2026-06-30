import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  @ApiOperation({
    summary: 'Verificar estado del servicio',
    description:
      'Health check. Retorna el estado del servicio y el timestamp actual.',
  })
  @ApiResponse({ status: 200, description: 'Servicio operativo.' })
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'emprende-x-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
