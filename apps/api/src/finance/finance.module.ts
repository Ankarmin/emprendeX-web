import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ExpenseDetailEntity } from '../expenses/entities/expense-detail.entity';
import { ExpenseEntity } from '../expenses/entities/expense.entity';
import { FinancialCategoryEntity } from '../financial-categories/entities/financial-category.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { PaymentDetailEntity } from '../payments/entities/payment-detail.entity';
import { PaymentMethodEntity } from '../payments/entities/payment-method.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { UsersModule } from '../users/users.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentEntity,
      PaymentDetailEntity,
      PaymentMethodEntity,
      FinancialCategoryEntity,
      ExpenseEntity,
      ExpenseDetailEntity,
      OrderEntity,
    ]),
    AuditLogsModule,
    UsersModule,
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
