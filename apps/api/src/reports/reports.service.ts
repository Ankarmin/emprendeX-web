import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { RlsContextService } from '../database/rls/rls-context.service';
import { ExpenseEntity } from '../expenses/entities/expense.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { QuotationDetailEntity } from '../quotations/entities/quotation-detail.entity';
import { UsersService } from '../users/users.service';

type RawBusinessKpis = {
  business_id: string;
  timezone: string;
  fecha_local: string;
  generado_en: string;
  ventas_del_dia: {
    ventas_hoy: string | number;
    ventas_ayer: string | number;
    variacion_porcentual: string | number;
  };
  pedidos: {
    total_hoy: number;
    sub_estados: {
      pendientes: number;
      reservas: number;
      activos: number;
      entregados: number;
      en_camino: number;
    };
  };
  cobros_pendientes: {
    total: string | number;
  };
  clientes_nuevos: {
    hoy: number;
    ayer: number;
    diferencia_vs_ayer: number;
  };
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly rlsContextService: RlsContextService,
    private readonly usersService: UsersService,
  ) {}

  async getOverview(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.usersService.findPrimaryBusinessByUserId(
        userId,
        manager,
      );

      if (!business) {
        return {
          totalSales: '0.00',
          totalExpenses: '0.00',
          pendingCollections: '0.00',
          topItems: [],
        };
      }

      const [payments, expenses, quotationDetails] = await Promise.all([
        this.loadPayments(manager, business.businessId),
        this.loadExpenses(manager, business.businessId),
        this.loadQuotationDetails(manager, business.businessId),
      ]);

      const totalSales = payments.reduce(
        (sum, payment) => sum + Number(payment.order.quotation.total),
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
    });
  }

  async getBusinessKpis(userId: string, timezone = 'America/Lima') {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.usersService.findPrimaryBusinessByUserId(
        userId,
        manager,
      );

      if (!business) {
        return this.getEmptyBusinessKpis(timezone);
      }

      const [row] = await manager.query<{ kpis: RawBusinessKpis }[]>(
        'SELECT public.get_business_kpis($1::uuid, $2::text) AS kpis',
        [business.businessId, timezone],
      );

      return this.mapBusinessKpis(row?.kpis, timezone);
    });
  }

  private loadPayments(manager: EntityManager, businessId: string) {
    return manager.getRepository(PaymentEntity).find({
      where: { businessId },
      relations: { order: { quotation: true }, paymentDetails: true },
    });
  }

  private loadExpenses(manager: EntityManager, businessId: string) {
    return manager.getRepository(ExpenseEntity).find({
      where: { businessId },
    });
  }

  private loadQuotationDetails(manager: EntityManager, businessId: string) {
    return manager.getRepository(QuotationDetailEntity).find({
      where: { businessId },
      relations: { item: true },
    });
  }

  private mapBusinessKpis(kpis: RawBusinessKpis | undefined, timezone: string) {
    if (!kpis) {
      return this.getEmptyBusinessKpis(timezone);
    }

    return {
      businessId: kpis.business_id,
      timezone: kpis.timezone,
      localDate: kpis.fecha_local,
      generatedAt: kpis.generado_en,
      dailySales: {
        today: Number(kpis.ventas_del_dia.ventas_hoy).toFixed(2),
        yesterday: Number(kpis.ventas_del_dia.ventas_ayer).toFixed(2),
        percentageChange: Number(
          kpis.ventas_del_dia.variacion_porcentual,
        ).toFixed(2),
      },
      orders: {
        totalToday: Number(kpis.pedidos.total_hoy),
        statuses: {
          pending: Number(kpis.pedidos.sub_estados.pendientes),
          reserved: Number(kpis.pedidos.sub_estados.reservas),
          active: Number(kpis.pedidos.sub_estados.activos),
          delivered: Number(kpis.pedidos.sub_estados.entregados),
          onTheWay: Number(kpis.pedidos.sub_estados.en_camino),
        },
      },
      pendingCollections: {
        total: Number(kpis.cobros_pendientes.total).toFixed(2),
      },
      newCustomers: {
        today: Number(kpis.clientes_nuevos.hoy),
        yesterday: Number(kpis.clientes_nuevos.ayer),
        differenceVsYesterday: Number(kpis.clientes_nuevos.diferencia_vs_ayer),
      },
    };
  }

  private getEmptyBusinessKpis(timezone: string) {
    return {
      businessId: null,
      timezone,
      localDate: null,
      generatedAt: new Date().toISOString(),
      dailySales: {
        today: '0.00',
        yesterday: '0.00',
        percentageChange: '0.00',
      },
      orders: {
        totalToday: 0,
        statuses: {
          pending: 0,
          reserved: 0,
          active: 0,
          delivered: 0,
          onTheWay: 0,
        },
      },
      pendingCollections: {
        total: '0.00',
      },
      newCustomers: {
        today: 0,
        yesterday: 0,
        differenceVsYesterday: 0,
      },
    };
  }
}
