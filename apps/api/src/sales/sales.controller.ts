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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SKIP_ALL_THROTTLERS } from '../common/throttling/throttler.constants';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { SalesService } from './sales.service';

@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('cotizaciones')
  listQuotations(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.salesService.listQuotations(currentUser.id);
  }

  @Post('cotizaciones')
  createQuotation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.salesService.createQuotation(currentUser.id, dto);
  }

  @Delete('cotizaciones/:quotationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeQuotation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('quotationId', new ParseUUIDPipe()) quotationId: string,
  ): Promise<void> {
    await this.salesService.removeQuotation(currentUser.id, quotationId);
  }

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

  @Get('operaciones')
  listOperations(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.salesService.listOperations(currentUser.id);
  }

  @Get('operaciones/:operationId')
  findOperationById(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('operationId', new ParseUUIDPipe()) operationId: string,
  ) {
    return this.salesService.findOperationById(currentUser.id, operationId);
  }

  @Get('pedidos/pendientes')
  listPendingOrders(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.salesService.listPendingOrders(currentUser.id);
  }
}
