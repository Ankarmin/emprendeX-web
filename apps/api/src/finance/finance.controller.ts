import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CreateFinancialCategoryDto } from './dto/create-financial-category.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateFinancialCategoryDto } from './dto/update-financial-category.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { FinanceService } from './finance.service';

@ApiTags('Finanzas')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contabilidad', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @ApiOperation({
    summary: 'Resumen financiero',
    description: 'Obtiene el resumen financiero del negocio.',
  })
  @ApiResponse({ status: 200, description: 'Resumen financiero.' })
  @Get('summary')
  getSummary(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.financeService.getSummary(currentUser.id);
  }

  @ApiOperation({ summary: 'Listar registros financieros' })
  @ApiResponse({ status: 200, description: 'Lista de registros financieros.' })
  @Get('records')
  listRecords(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.financeService.listRecords(currentUser.id);
  }

  @ApiOperation({
    summary: 'Detalles de pago',
    description: 'Obtiene los detalles de un pago específico.',
  })
  @ApiResponse({ status: 200, description: 'Detalles del pago.' })
  @Get('payments/:paymentId/details')
  listPaymentDetails(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('paymentId', new ParseUUIDPipe()) paymentId: string,
  ) {
    return this.financeService.listPaymentDetails(currentUser.id, paymentId);
  }

  @ApiOperation({ summary: 'Listar métodos de pago' })
  @ApiResponse({ status: 200, description: 'Lista de métodos de pago.' })
  @Get('payment-methods')
  listPaymentMethods(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.financeService.listPaymentMethods(currentUser.id);
  }

  @ApiOperation({ summary: 'Crear método de pago' })
  @ApiResponse({ status: 201, description: 'Método de pago creado.' })
  @Post('payment-methods')
  @HttpCode(HttpStatus.CREATED)
  createPaymentMethod(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreatePaymentMethodDto,
  ) {
    return this.financeService.createPaymentMethod(currentUser.id, dto);
  }

  @ApiOperation({ summary: 'Actualizar método de pago' })
  @ApiResponse({ status: 200, description: 'Método de pago actualizado.' })
  @Patch('payment-methods/:paymentMethodId')
  updatePaymentMethod(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('paymentMethodId', new ParseUUIDPipe()) paymentMethodId: string,
    @Body() dto: UpdatePaymentMethodDto,
  ) {
    return this.financeService.updatePaymentMethod(
      currentUser.id,
      paymentMethodId,
      dto,
    );
  }

  @ApiOperation({ summary: 'Eliminar método de pago' })
  @ApiResponse({ status: 204, description: 'Método de pago eliminado.' })
  @Delete('payment-methods/:paymentMethodId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePaymentMethod(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('paymentMethodId', new ParseUUIDPipe()) paymentMethodId: string,
  ): Promise<void> {
    await this.financeService.deletePaymentMethod(
      currentUser.id,
      paymentMethodId,
    );
  }

  @ApiOperation({ summary: 'Listar categorías financieras' })
  @ApiResponse({ status: 200, description: 'Lista de categorías financieras.' })
  @Get('financial-categories')
  listFinancialCategories(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.financeService.listFinancialCategories(currentUser.id);
  }

  @ApiOperation({ summary: 'Crear categoría financiera' })
  @ApiResponse({ status: 201, description: 'Categoría financiera creada.' })
  @Post('financial-categories')
  @HttpCode(HttpStatus.CREATED)
  createFinancialCategory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateFinancialCategoryDto,
  ) {
    return this.financeService.createFinancialCategory(currentUser.id, dto);
  }

  @ApiOperation({ summary: 'Actualizar categoría financiera' })
  @ApiResponse({
    status: 200,
    description: 'Categoría financiera actualizada.',
  })
  @Patch('financial-categories/:financialCategoryId')
  updateFinancialCategory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('financialCategoryId', new ParseUUIDPipe())
    financialCategoryId: string,
    @Body() dto: UpdateFinancialCategoryDto,
  ) {
    return this.financeService.updateFinancialCategory(
      currentUser.id,
      financialCategoryId,
      dto,
    );
  }

  @ApiOperation({ summary: 'Eliminar categoría financiera' })
  @ApiResponse({ status: 204, description: 'Categoría financiera eliminada.' })
  @Delete('financial-categories/:financialCategoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFinancialCategory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('financialCategoryId', new ParseUUIDPipe())
    financialCategoryId: string,
  ): Promise<void> {
    await this.financeService.deleteFinancialCategory(
      currentUser.id,
      financialCategoryId,
    );
  }

  @ApiOperation({
    summary: 'Registrar pago',
    description: 'Registra un pago para un pedido.',
  })
  @ApiResponse({ status: 201, description: 'Pago registrado.' })
  @Post('payments')
  createPayment(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.financeService.createPayment(currentUser.id, dto);
  }

  @ApiOperation({ summary: 'Registrar gasto' })
  @ApiResponse({ status: 201, description: 'Gasto registrado.' })
  @Post('expenses')
  createExpense(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.financeService.createExpense(currentUser.id, dto);
  }
}
