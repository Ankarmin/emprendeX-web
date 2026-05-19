import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ItemEntity } from '../catalog/entities/item.entity';
import { Customer } from '../customers/entities/customer.entity';
import { OrderStatus } from '../database/database.enums';
import { OrderEntity } from '../orders/entities/order.entity';
import { QuotationDetailEntity } from '../quotations/entities/quotation-detail.entity';
import { QuotationEntity } from '../quotations/entities/quotation.entity';
import { UsersService } from '../users/users.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';

type OperationSummary = {
  id: string;
  referenceCode: string;
  type: 'Pedido' | 'Cotización';
  customerName: string;
  total: string;
  status: string;
  createdAt: string;
};

@Injectable()
export class SalesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(ItemEntity)
    private readonly itemsRepository: Repository<ItemEntity>,
    @InjectRepository(QuotationEntity)
    private readonly quotationsRepository: Repository<QuotationEntity>,
    @InjectRepository(QuotationDetailEntity)
    private readonly quotationDetailsRepository: Repository<QuotationDetailEntity>,
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
  ) {}

  async listQuotations(userId: string) {
    const business = await this.getBusinessOrThrow(userId);
    const quotations = await this.quotationsRepository.find({
      where: { customer: { businessId: business.businessId } },
      relations: { customer: true, quotationDetails: true, orders: true },
      order: { createdAt: 'DESC' },
    });

    return quotations.map((quotation) => this.mapQuotationSummary(quotation));
  }

  async createQuotation(userId: string, dto: CreateQuotationDto) {
    const business = await this.getBusinessOrThrow(userId);
    const customer = await this.customersRepository.findOne({
      where: { customerId: dto.customerId, businessId: business.businessId },
    });

    if (!customer) {
      throw new BadRequestException('Cliente no pertenece al negocio');
    }

    const items = await this.itemsRepository.find({
      where: { itemId: In(dto.itemIds) },
    });
    if (items.length !== dto.itemIds.length) {
      throw new BadRequestException('Uno o más items no existen');
    }

    const total = items.reduce((sum, item) => sum + Number(item.price), 0);

    const quotation = await this.dataSource.transaction(async (manager) => {
      const quotationRepository = manager.getRepository(QuotationEntity);
      const quotationDetailRepository = manager.getRepository(
        QuotationDetailEntity,
      );
      const referenceCode = await this.generateNextReferenceCode(
        business.businessId,
        'COT',
        'quotations',
        manager,
      );

      const createdQuotation = quotationRepository.create({
        customerId: customer.customerId,
        description: dto.description?.trim() || null,
        deliveryDate: new Date(dto.deliveryDate),
        deliveryMethod: dto.deliveryMethod,
        total: total.toFixed(2),
        referenceCode,
      });

      const savedQuotation = await quotationRepository.save(createdQuotation);

      const quotationDetails = items.map((item) =>
        quotationDetailRepository.create({
          quotationId: savedQuotation.quotationId,
          itemId: item.itemId,
          quantity: 1,
          discount: '0.00',
        }),
      );

      await quotationDetailRepository.save(quotationDetails);

      return quotationRepository.findOneOrFail({
        where: { quotationId: savedQuotation.quotationId },
        relations: { customer: true, quotationDetails: true, orders: true },
      });
    });

    return this.mapQuotationSummary(quotation);
  }

  async convertQuotationToOrder(userId: string, quotationId: string) {
    const business = await this.getBusinessOrThrow(userId);
    const quotation = await this.quotationsRepository.findOne({
      where: { quotationId, customer: { businessId: business.businessId } },
      relations: { customer: true, quotationDetails: true, orders: true },
    });

    if (!quotation) {
      throw new NotFoundException('Cotización no encontrada');
    }

    if (quotation.orders.length > 0) {
      return this.mapOperationSummary(
        quotation.orders[0],
        quotation,
        quotation.customer,
      );
    }

    const order = await this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(OrderEntity);
      const referenceCode = await this.generateNextReferenceCode(
        business.businessId,
        'PED',
        'orders',
        manager,
      );

      const createdOrder = orderRepository.create({
        quotationId: quotation.quotationId,
        status: OrderStatus.Pending,
        notes: quotation.description,
        referenceCode,
      });

      return orderRepository.save(createdOrder);
    });

    return this.mapOperationSummary(order, quotation, quotation.customer);
  }

  async listOperations(userId: string) {
    const business = await this.getBusinessOrThrow(userId);
    const quotations = await this.quotationsRepository.find({
      where: { customer: { businessId: business.businessId } },
      relations: { customer: true, orders: true },
      order: { createdAt: 'DESC' },
    });

    const operations: OperationSummary[] = [];
    for (const quotation of quotations) {
      if (quotation.orders.length > 0) {
        for (const order of quotation.orders) {
          operations.push(
            this.mapOperationSummary(order, quotation, quotation.customer),
          );
        }
      } else {
        operations.push({
          id: quotation.quotationId,
          referenceCode: quotation.referenceCode,
          type: 'Cotización',
          customerName: this.buildCustomerName(quotation.customer),
          total: quotation.total,
          status: 'Pendiente',
          createdAt: quotation.createdAt.toISOString(),
        });
      }
    }

    return operations.sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  async findOperationById(userId: string, operationId: string) {
    const business = await this.getBusinessOrThrow(userId);
    const order = await this.ordersRepository.findOne({
      where: {
        orderId: operationId,
        quotation: { customer: { businessId: business.businessId } },
      },
      relations: {
        quotation: {
          customer: true,
          quotationDetails: { item: true },
        },
      },
    });

    if (order) {
      return {
        id: order.orderId,
        referenceCode: order.referenceCode,
        type: 'Pedido',
        status: order.status,
        customer: this.mapCustomer(order.quotation.customer),
        deliveryDate: order.quotation.deliveryDate.toISOString(),
        deliveryMethod: order.quotation.deliveryMethod,
        description: order.quotation.description,
        quotationReferenceCode: order.quotation.referenceCode,
        total: order.quotation.total,
        items: order.quotation.quotationDetails.map((detail) => ({
          id: detail.quotationDetailId,
          itemId: detail.itemId,
          name: detail.item.name,
          kind: detail.item.itemClass,
          quantity: detail.quantity,
          discount: detail.discount,
          price: detail.item.price,
        })),
      };
    }

    const quotation = await this.quotationsRepository.findOne({
      where: {
        quotationId: operationId,
        customer: { businessId: business.businessId },
      },
      relations: { customer: true, quotationDetails: { item: true } },
    });

    if (!quotation) {
      throw new NotFoundException('Operación no encontrada');
    }

    return {
      id: quotation.quotationId,
      referenceCode: quotation.referenceCode,
      type: 'Cotización',
      status: 'Pendiente',
      customer: this.mapCustomer(quotation.customer),
      deliveryDate: quotation.deliveryDate.toISOString(),
      deliveryMethod: quotation.deliveryMethod,
      description: quotation.description,
      quotationReferenceCode: quotation.referenceCode,
      total: quotation.total,
      items: quotation.quotationDetails.map((detail) => ({
        id: detail.quotationDetailId,
        itemId: detail.itemId,
        name: detail.item.name,
        kind: detail.item.itemClass,
        quantity: detail.quantity,
        discount: detail.discount,
        price: detail.item.price,
      })),
    };
  }

  async listPendingOrders(userId: string) {
    const business = await this.getBusinessOrThrow(userId);
    const orders = await this.ordersRepository.find({
      where: { quotation: { customer: { businessId: business.businessId } } },
      relations: {
        quotation: { customer: true },
        payments: { paymentDetails: true },
      },
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => {
      const paidAmount = order.payments.reduce(
        (sum, payment) =>
          sum +
          payment.paymentDetails.reduce(
            (detailSum, detail) => detailSum + Number(detail.subtotal),
            0,
          ),
        0,
      );
      const total = Number(order.quotation.total);
      const balance = Math.max(total - paidAmount, 0);

      return {
        id: order.orderId,
        referenceCode: order.referenceCode,
        customerName: this.buildCustomerName(order.quotation.customer),
        total: order.quotation.total,
        balance: balance.toFixed(2),
      };
    });
  }

  private async getBusinessOrThrow(userId: string) {
    const business =
      await this.usersService.findPrimaryBusinessByUserId(userId);
    if (!business) {
      throw new BadRequestException('Business profile is not configured');
    }
    return business;
  }

  private mapQuotationSummary(quotation: QuotationEntity) {
    return {
      id: quotation.quotationId,
      referenceCode: quotation.referenceCode,
      customerId: quotation.customerId,
      customerName: this.buildCustomerName(quotation.customer),
      description: quotation.description,
      deliveryDate: quotation.deliveryDate.toISOString(),
      deliveryMethod: quotation.deliveryMethod,
      total: quotation.total,
      itemsCount: quotation.quotationDetails.length,
      status: quotation.orders.length > 0 ? 'Aprobada' : 'Pendiente',
      createdAt: quotation.createdAt.toISOString(),
    };
  }

  private mapOperationSummary(
    order: OrderEntity,
    quotation: QuotationEntity,
    customer: Customer,
  ): OperationSummary {
    return {
      id: order.orderId,
      referenceCode: order.referenceCode,
      type: 'Pedido',
      customerName: this.buildCustomerName(customer),
      total: quotation.total,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    };
  }

  private buildCustomerName(customer: Customer) {
    return `${customer.firstNames} ${customer.lastNames ?? ''}`.trim();
  }

  private mapCustomer(customer: Customer) {
    return {
      id: customer.customerId,
      fullName: this.buildCustomerName(customer),
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    };
  }

  private async generateNextReferenceCode(
    businessId: string,
    prefix: 'COT' | 'PED',
    tableName: 'quotations' | 'orders',
    manager: EntityManager,
  ): Promise<string> {
    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `${businessId}:${prefix}`,
    ]);

    const [row] = await manager.query<
      { lastReferenceNumber: number | string | null }[]
    >(
      tableName === 'quotations'
        ? `
            SELECT COALESCE(
              MAX(CAST(SUBSTRING(q.reference_code FROM '${prefix}-(\\d+)$') AS INTEGER)),
              0
            ) AS "lastReferenceNumber"
            FROM "quotations" q
            INNER JOIN "customers" c ON c."customer_id" = q."customer_id"
            WHERE c."business_id" = $1
          `
        : `
            SELECT COALESCE(
              MAX(CAST(SUBSTRING(o.reference_code FROM '${prefix}-(\\d+)$') AS INTEGER)),
              0
            ) AS "lastReferenceNumber"
            FROM "orders" o
            INNER JOIN "quotations" q ON q."quotation_id" = o."quotation_id"
            INNER JOIN "customers" c ON c."customer_id" = q."customer_id"
            WHERE c."business_id" = $1
          `,
      [businessId],
    );

    return `${prefix}-${Number(row?.lastReferenceNumber ?? 0) + 1}`;
  }
}
