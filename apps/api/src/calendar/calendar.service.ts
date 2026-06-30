import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { RlsContextService } from '../database/rls/rls-context.service';
import { OrderEntity } from '../orders/entities/order.entity';
import { QuotationEntity } from '../quotations/entities/quotation.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class CalendarService {
  constructor(
    private readonly rlsContextService: RlsContextService,
    private readonly usersService: UsersService,
  ) {}

  async listEvents(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.usersService.findPrimaryBusinessByUserId(
        userId,
        manager,
      );

      if (!business) {
        return [];
      }

      const [orders, quotations] = await Promise.all([
        this.getOrdersForCalendar(manager, business.businessId),
        this.getQuotationsForCalendar(manager, business.businessId),
      ]);

      return [
        ...orders.map((order) => ({
          id: order.orderId,
          referenceCode: order.referenceCode,
          type: 'Pedido',
          title: `${order.referenceCode} · ${order.quotation.customer.firstNames}`,
          status: order.status,
          date: order.quotation.deliveryDate.toISOString(),
        })),
        ...quotations.map((quotation) => ({
          id: quotation.quotationId,
          referenceCode: quotation.referenceCode,
          type: 'Cotización',
          title: `${quotation.referenceCode} · ${quotation.customer.firstNames}`,
          status: quotation.order ? 'Aprobada' : 'Pendiente',
          date: quotation.deliveryDate.toISOString(),
        })),
      ].sort((left, right) => left.date.localeCompare(right.date));
    });
  }

  private getOrdersForCalendar(manager: EntityManager, businessId: string) {
    return manager.getRepository(OrderEntity).find({
      where: { businessId },
      relations: { quotation: { customer: true } },
      order: { createdAt: 'DESC' },
    });
  }

  private getQuotationsForCalendar(manager: EntityManager, businessId: string) {
    return manager.getRepository(QuotationEntity).find({
      where: { businessId },
      relations: { customer: true, order: true },
      order: { createdAt: 'DESC' },
    });
  }
}
