import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EntityManager, In } from 'typeorm';
import { ItemEntity } from '../catalog/entities/item.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import {
  AuditAction,
  ItemClass,
  OrderStatus,
  PaymentStatus,
  QuotationOrigin,
} from '../database/database.enums';
import { OrderEntity } from '../orders/entities/order.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { QuotationDetailEntity } from '../quotations/entities/quotation-detail.entity';
import { QuotationEntity } from '../quotations/entities/quotation.entity';
import { RlsContextService } from '../database/rls/rls-context.service';
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
  originLabel: string | null;
};

@Injectable()
export class SalesService {
  constructor(
    private readonly rlsContextService: RlsContextService,
    private readonly auditLogsService: AuditLogsService,
    private readonly usersService: UsersService,
  ) {}

  async listQuotations(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const quotations = await manager.getRepository(QuotationEntity).find({
        where: { businessId: business.businessId },
        relations: { customer: true, quotationDetails: true, order: true },
        order: { createdAt: 'DESC' },
      });

      return quotations.map((quotation) => this.mapQuotationSummary(quotation));
    });
  }

  async createQuotation(userId: string, dto: CreateQuotationDto) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const customersRepository = manager.getRepository(Customer);
      const itemsRepository = manager.getRepository(ItemEntity);
      const quotationsRepository = manager.getRepository(QuotationEntity);
      const quotationDetailsRepository = manager.getRepository(
        QuotationDetailEntity,
      );
      const customer = await customersRepository.findOne({
        where: { customerId: dto.customerId, businessId: business.businessId },
      });

      if (!customer) {
        throw new BadRequestException('Cliente no pertenece al negocio');
      }

      const itemIds = dto.details.map((detail) => detail.itemId);
      const uniqueItemIds = Array.from(new Set(itemIds));
      if (uniqueItemIds.length !== itemIds.length) {
        throw new BadRequestException(
          'No se permiten items repetidos en la cotización',
        );
      }

      const items = await itemsRepository.find({
        where: { businessId: business.businessId, itemId: In(itemIds) },
      });
      if (items.length !== dto.details.length) {
        throw new BadRequestException('Uno o más items no existen en el negocio');
      }

      const itemMap = new Map(items.map((item) => [item.itemId, item]));
      const total = dto.details.reduce((sum, detail) => {
        const unitPrice = Number(detail.unitPrice);
        const discount = Number(detail.discount ?? '0.00');
        return sum + detail.quantity * unitPrice - discount;
      }, 0);

      for (const detail of dto.details) {
        const item = itemMap.get(detail.itemId);

        if (!item) {
          throw new BadRequestException('Item de cotización inválido');
        }

        if (item.itemClass !== ItemClass.Product) {
          continue;
        }

        const result = await manager
          .createQueryBuilder()
          .update(ProductEntity)
          .set({ stock: () => '"stock" - :quantity' })
          .where('business_id = :businessId', { businessId: business.businessId })
          .andWhere('item_id = :itemId', { itemId: item.itemId })
          .andWhere('stock >= :quantity', { quantity: detail.quantity })
          .execute();

        if (result.affected !== 1) {
          throw new BadRequestException(
            `La cantidad solicitada supera el stock disponible de ${item.name}`,
          );
        }
      }

      const createdQuotation = await quotationsRepository.save(
        quotationsRepository.create({
          businessId: business.businessId,
          customerId: customer.customerId,
          description: dto.description?.trim() || null,
          deliveryDate: new Date(dto.deliveryDate),
          deliveryMethod: dto.deliveryMethod,
          total: total.toFixed(2),
        }),
      );

      await quotationDetailsRepository.save(
        dto.details.map((detail) => {
          const item = itemMap.get(detail.itemId);

          if (!item) {
            throw new BadRequestException('Item de cotización inválido');
          }

          const discount = detail.discount ?? '0.00';
          if (Number(discount) > detail.quantity * Number(detail.unitPrice)) {
            throw new BadRequestException(
              'El descuento no puede superar el subtotal',
            );
          }

          return quotationDetailsRepository.create({
            businessId: business.businessId,
            quotationId: createdQuotation.quotationId,
            itemId: item.itemId,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            discount,
          });
        }),
      );

      const quotation = await quotationsRepository.findOneOrFail({
        where: {
          quotationId: createdQuotation.quotationId,
          businessId: business.businessId,
        },
        relations: { customer: true, quotationDetails: true, order: true },
      });

      await this.auditLogsService.createWithManager(manager, {
        actorUserId: userId,
        businessId: business.businessId,
        action: AuditAction.Create,
        tableName: 'quotations',
        recordId: quotation.quotationId,
      });

      return this.mapQuotationSummary(quotation);
    });
  }

  async removeQuotation(userId: string, quotationId: string): Promise<void> {
    await this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const quotationsRepository = manager.getRepository(QuotationEntity);
      const quotation = await quotationsRepository.findOne({
        where: { quotationId, businessId: business.businessId },
        relations: { order: true },
      });

      if (!quotation) {
        throw new NotFoundException('Cotización no encontrada');
      }

      if (quotation.order) {
        throw new BadRequestException(
          'No se puede eliminar una cotización que ya fue aprobada',
        );
      }

      await quotationsRepository.delete({
        quotationId,
        businessId: business.businessId,
      });

      await this.auditLogsService.createWithManager(manager, {
        actorUserId: userId,
        businessId: business.businessId,
        action: AuditAction.Delete,
        tableName: 'quotations',
        recordId: quotation.quotationId,
      });
    });
  }

  async convertQuotationToOrder(userId: string, quotationId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const quotationsRepository = manager.getRepository(QuotationEntity);
      const ordersRepository = manager.getRepository(OrderEntity);
      const paymentsRepository = manager.getRepository(PaymentEntity);
      const quotation = await quotationsRepository.findOne({
        where: { quotationId, businessId: business.businessId },
        relations: { customer: true, quotationDetails: true, order: true },
      });

      if (!quotation) {
        throw new NotFoundException('Cotización no encontrada');
      }

      if (quotation.order) {
        return this.mapOperationSummary(
          quotation.order,
          quotation,
          quotation.customer,
        );
      }

      const order = await ordersRepository.save(
        ordersRepository.create({
          businessId: business.businessId,
          quotationId: quotation.quotationId,
          status: OrderStatus.Pending,
          notes: quotation.description,
        }),
      );

      await paymentsRepository.save(
        paymentsRepository.create({
          businessId: business.businessId,
          orderId: order.orderId,
          status: PaymentStatus.Unpaid,
          remainingTotal: quotation.total,
        }),
      );

      await this.auditLogsService.createWithManager(manager, {
        actorUserId: userId,
        businessId: business.businessId,
        action: AuditAction.Create,
        tableName: 'orders',
        recordId: order.orderId,
      });

      return this.mapOperationSummary(order, quotation, quotation.customer);
    });
  }

  async listOperations(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const quotations = await manager.getRepository(QuotationEntity).find({
        where: { businessId: business.businessId },
        relations: { customer: true, order: true },
        order: { createdAt: 'DESC' },
      });

      const operations: OperationSummary[] = quotations.map((quotation) => {
        if (quotation.order) {
          return this.mapOperationSummary(
            quotation.order,
            quotation,
            quotation.customer,
          );
        }

        return {
          id: quotation.quotationId,
          referenceCode: quotation.referenceCode,
          type: 'Cotización',
          customerName: this.buildCustomerName(quotation.customer),
          total: quotation.total,
          status: 'Pendiente',
          createdAt: quotation.createdAt.toISOString(),
          originLabel: quotation.origin === QuotationOrigin.PublicCatalog
            ? 'Origen: Catálogo público'
            : null,
        };
      });

      return operations.sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );
    });
  }

  async findOperationById(userId: string, operationId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const ordersRepository = manager.getRepository(OrderEntity);
      const quotationsRepository = manager.getRepository(QuotationEntity);
      const order = await ordersRepository.findOne({
        where: { orderId: operationId, businessId: business.businessId },
        relations: {
          payment: { paymentDetails: true },
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
          sourceLabel:
            order.quotation.origin === QuotationOrigin.PublicCatalog
              ? 'Creada desde catálogo público'
              : null,
          total: order.quotation.total,
          remainingTotal: order.payment?.remainingTotal ?? order.quotation.total,
          items: order.quotation.quotationDetails.map((detail) => ({
            id: detail.quotationDetailId,
            itemId: detail.itemId,
            name: detail.item.name,
            kind: detail.item.itemClass,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            price: detail.unitPrice,
            discount: detail.discount,
          })),
        };
      }

      const quotation = await quotationsRepository.findOne({
        where: { quotationId: operationId, businessId: business.businessId },
        relations: {
          customer: true,
          order: true,
          quotationDetails: { item: true },
        },
      });

      if (!quotation) {
        throw new NotFoundException('Operación no encontrada');
      }

      return {
        id: quotation.quotationId,
        referenceCode: quotation.referenceCode,
        type: 'Cotización',
        status: quotation.order ? 'Aprobada' : 'Pendiente',
        customer: this.mapCustomer(quotation.customer),
        deliveryDate: quotation.deliveryDate.toISOString(),
        deliveryMethod: quotation.deliveryMethod,
        description: quotation.description,
        quotationReferenceCode: quotation.referenceCode,
        sourceLabel: quotation.origin === QuotationOrigin.PublicCatalog
          ? 'Creada desde catálogo público'
          : null,
        total: quotation.total,
        items: quotation.quotationDetails.map((detail) => ({
          id: detail.quotationDetailId,
          itemId: detail.itemId,
          name: detail.item.name,
          kind: detail.item.itemClass,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          price: detail.unitPrice,
          discount: detail.discount,
        })),
      };
    });
  }

  async listPendingOrders(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const orders = await manager.getRepository(OrderEntity).find({
        where: { businessId: business.businessId },
        relations: {
          payment: true,
          quotation: { customer: true },
        },
        order: { createdAt: 'DESC' },
      });

      return orders
        .map((order) => ({
          id: order.orderId,
          referenceCode: order.referenceCode,
          customerName: this.buildCustomerName(order.quotation.customer),
          total: order.quotation.total,
          balance: order.payment?.remainingTotal ?? order.quotation.total,
        }))
        .filter((order) => Number(order.balance) > 0);
    });
  }

  private async getBusinessOrThrow(userId: string, manager?: EntityManager) {
    const business =
      await this.usersService.findPrimaryBusinessByUserId(userId, manager);
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
      status: quotation.order ? 'Aprobada' : 'Pendiente',
      createdAt: quotation.createdAt.toISOString(),
      originLabel: quotation.origin === QuotationOrigin.PublicCatalog
        ? 'Origen: Catálogo público'
        : null,
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
      originLabel: quotation.origin === QuotationOrigin.PublicCatalog
        ? 'Origen: Catálogo público'
        : null,
    };
  }

  private mapCustomer(customer: Customer) {
    return {
      id: customer.customerId,
      firstNames: customer.firstNames,
      lastNames: customer.lastNames,
      fullName: this.buildCustomerName(customer),
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    };
  }

  private buildCustomerName(customer: Customer) {
    return `${customer.firstNames} ${customer.lastNames ?? ''}`.trim();
  }
}
