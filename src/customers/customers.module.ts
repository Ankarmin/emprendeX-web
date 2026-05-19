import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../orders/entities/order.entity';
import { QuotationEntity } from '../quotations/entities/quotation.entity';
import { UsersModule } from '../users/users.module';
import { Customer } from './entities/customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, QuotationEntity, OrderEntity]),
    UsersModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
