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

@Controller({ path: 'contabilidad', version: '1' })
@UseGuards(JwtAuthGuard)
@SkipThrottle(SKIP_ALL_THROTTLERS)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getSummary(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.financeService.getSummary(currentUser.id);
  }

  @Get('records')
  listRecords(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.financeService.listRecords(currentUser.id);
  }

  @Get('payments/:paymentId/details')
  listPaymentDetails(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('paymentId', new ParseUUIDPipe()) paymentId: string,
  ) {
    return this.financeService.listPaymentDetails(currentUser.id, paymentId);
  }

  @Get('payment-methods')
  listPaymentMethods(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.financeService.listPaymentMethods(currentUser.id);
  }

  @Post('payment-methods')
  @HttpCode(HttpStatus.CREATED)
  createPaymentMethod(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreatePaymentMethodDto,
  ) {
    return this.financeService.createPaymentMethod(currentUser.id, dto);
  }

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

  @Get('financial-categories')
  listFinancialCategories(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.financeService.listFinancialCategories(currentUser.id);
  }

  @Post('financial-categories')
  @HttpCode(HttpStatus.CREATED)
  createFinancialCategory(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateFinancialCategoryDto,
  ) {
    return this.financeService.createFinancialCategory(currentUser.id, dto);
  }

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

  @Post('payments')
  createPayment(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.financeService.createPayment(currentUser.id, dto);
  }

  @Post('expenses')
  createExpense(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.financeService.createExpense(currentUser.id, dto);
  }
}
