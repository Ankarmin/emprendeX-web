import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseEntity } from '../expenses/entities/expense.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { QuotationDetailEntity } from '../quotations/entities/quotation-detail.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentsRepository: Repository<PaymentEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expensesRepository: Repository<ExpenseEntity>,
    @InjectRepository(QuotationDetailEntity)
    private readonly quotationDetailsRepository: Repository<QuotationDetailEntity>,
  ) {}

  async getOverview(userId: string) {
    const business =
      await this.usersService.findPrimaryBusinessByUserId(userId);
    if (!business) {
      return {
        totalSales: '0.00',
        totalExpenses: '0.00',
        pendingCollections: '0.00',
        topItems: [],
      };
    }

    const [orders, payments, expenses, quotationDetails] = await Promise.all([
      this.ordersRepository.find({
        where: { quotation: { customer: { businessId: business.businessId } } },
        relations: { quotation: true },
      }),
      this.paymentsRepository.find({
        where: {
          order: {
            quotation: { customer: { businessId: business.businessId } },
          },
        },
        relations: { paymentDetails: true },
      }),
      this.expensesRepository.find({
        where: { financialCategory: { businessId: business.businessId } },
      }),
      this.quotationDetailsRepository.find({
        where: { quotation: { customer: { businessId: business.businessId } } },
        relations: { item: true },
      }),
    ]);

    const totalSales = orders.reduce(
      (sum, order) => sum + Number(order.quotation.total),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.total),
      0,
    );
    const totalCollected = payments.reduce(
      (sum, payment) =>
        sum +
        payment.paymentDetails.reduce(
          (detailSum, detail) => detailSum + Number(detail.subtotal),
          0,
        ),
      0,
    );
    const pendingCollections = Math.max(totalSales - totalCollected, 0);

    const itemCountMap = new Map<string, { name: string; count: number }>();
    for (const detail of quotationDetails) {
      const current = itemCountMap.get(detail.itemId) ?? {
        name: detail.item.name,
        count: 0,
      };
      current.count += detail.quantity;
      itemCountMap.set(detail.itemId, current);
    }

    const topItems = Array.from(itemCountMap.values())
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);

    return {
      totalSales: totalSales.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      pendingCollections: pendingCollections.toFixed(2),
      topItems,
    };
  }
}
