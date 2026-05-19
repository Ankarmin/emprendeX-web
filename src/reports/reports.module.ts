import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseEntity } from '../expenses/entities/expense.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { QuotationDetailEntity } from '../quotations/entities/quotation-detail.entity';
import { UsersModule } from '../users/users.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      PaymentEntity,
      ExpenseEntity,
      QuotationDetailEntity,
    ]),
    UsersModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
