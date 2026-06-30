import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { SalesService } from './sales.service';

@ApiTags('Ventas')
@ApiBearerAuth('JWT-auth')
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @ApiOperation({
    summary: 'Listar cotizaciones',
    description: 'Lista todas las cotizaciones del negocio.',
  })
  @ApiResponse({ status: 200, description: 'Lista de cotizaciones.' })
  @Get('cotizaciones')
  listQuotations(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.salesService.listQuotations(currentUser.id);
  }

  @ApiOperation({
    summary: 'Crear cotización',
    description: 'Crea una nueva cotización con sus detalles.',
  })
  @ApiResponse({ status: 201, description: 'Cotización creada.' })
  @Post('cotizaciones')
  createQuotation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.salesService.createQuotation(currentUser.id, dto);
  }

  @ApiOperation({ summary: 'Eliminar cotización' })
  @ApiResponse({ status: 204, description: 'Cotización eliminada.' })
  @Delete('cotizaciones/:quotationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeQuotation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('quotationId', new ParseUUIDPipe()) quotationId: string,
  ): Promise<void> {
    await this.salesService.removeQuotation(currentUser.id, quotationId);
  }

  @ApiOperation({
    summary: 'Convertir cotización a pedido',
    description: 'Convierte una cotización existente en un pedido.',
  })
  @ApiResponse({ status: 201, description: 'Cotización convertida a pedido.' })
  @Post('cotizaciones/:quotationId/convertir')
  convertQuotationToOrder(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('quotationId', new ParseUUIDPipe()) quotationId: string,
  ) {
    return this.salesService.convertQuotationToOrder(
      currentUser.id,
      quotationId,
    );
  }

  @ApiOperation({
    summary: 'Listar operaciones',
    description: 'Lista todas las operaciones (pedidos) del negocio.',
  })
  @ApiResponse({ status: 200, description: 'Lista de operaciones.' })
  @Get('operaciones')
  listOperations(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.salesService.listOperations(currentUser.id);
  }

  @ApiOperation({
    summary: 'Obtener operación',
    description: 'Obtiene un pedido por ID.',
  })
  @ApiResponse({ status: 200, description: 'Operación encontrada.' })
  @Get('operaciones/:operationId')
  findOperationById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('operationId', new ParseUUIDPipe()) operationId: string,
  ) {
    return this.salesService.findOperationById(currentUser.id, operationId);
  }

  @ApiOperation({
    summary: 'Listar pedidos pendientes',
    description: 'Lista todos los pedidos en estado pendiente.',
  })
  @ApiResponse({ status: 200, description: 'Lista de pedidos pendientes.' })
  @Get('pedidos/pendientes')
  listPendingOrders(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.salesService.listPendingOrders(currentUser.id);
  }
}
