import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemEntity } from '../catalog/entities/item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { PaymentDetailEntity } from '../payments/entities/payment-detail.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { QuotationDetailEntity } from '../quotations/entities/quotation-detail.entity';
import { QuotationEntity } from '../quotations/entities/quotation.entity';
import { UsersModule } from '../users/users.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      ItemEntity,
      QuotationEntity,
      QuotationDetailEntity,
      OrderEntity,
      PaymentEntity,
      PaymentDetailEntity,
    ]),
    UsersModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
