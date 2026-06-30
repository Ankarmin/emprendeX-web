import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EntityManager, Repository } from 'typeorm';
import { ExpenseDetailEntity } from '../expenses/entities/expense-detail.entity';
import { ExpenseEntity } from '../expenses/entities/expense.entity';
import { FinancialCategoryEntity } from '../financial-categories/entities/financial-category.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { PaymentDetailEntity } from '../payments/entities/payment-detail.entity';
import { PaymentMethodEntity } from '../payments/entities/payment-method.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { AuditAction, PaymentStatus } from '../database/database.enums';
import { RlsContextService } from '../database/rls/rls-context.service';
import { UsersService } from '../users/users.service';
import { CreateFinancialCategoryDto } from './dto/create-financial-category.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdateFinancialCategoryDto } from './dto/update-financial-category.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class FinanceService {
  constructor(
    private readonly rlsContextService: RlsContextService,
    private readonly auditLogsService: AuditLogsService,
    private readonly usersService: UsersService,
    @InjectRepository(PaymentMethodEntity)
    private readonly paymentMethodsRepository: Repository<PaymentMethodEntity>,
    @InjectRepository(FinancialCategoryEntity)
    private readonly financialCategoriesRepository: Repository<FinancialCategoryEntity>,
  ) {}

  async getSummary(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const payments = await manager.getRepository(PaymentEntity).find({
        where: { businessId: business.businessId },
        relations: { paymentDetails: true },
      });
      const expenses = await manager.getRepository(ExpenseEntity).find({
        where: { businessId: business.businessId },
      });

      const totalPaid = payments.reduce(
        (sum, payment) =>
          sum +
          payment.paymentDetails.reduce(
            (detailSum, detail) => detailSum + Number(detail.subtotal),
            0,
          ),
        0,
      );
      const totalExpenses = expenses.reduce(
        (sum, expense) => sum + Number(expense.total),
        0,
      );

      return {
        totalPaid: totalPaid.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
      };
    });
  }

  async listRecords(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const [payments, expenses] = await Promise.all([
        manager.getRepository(PaymentEntity).find({
          where: { businessId: business.businessId },
          relations: {
            order: { quotation: { customer: true } },
            paymentDetails: { paymentMethod: true },
          },
          order: { createdAt: 'DESC' },
        }),
        manager.getRepository(ExpenseEntity).find({
          where: { businessId: business.businessId },
          relations: {
            financialCategory: true,
            expenseDetails: { paymentMethod: true },
          },
          order: { createdAt: 'DESC' },
        }),
      ]);

      const paymentRecords = payments.map((payment) => {
        const amount = payment.paymentDetails.reduce(
          (sum, detail) => sum + Number(detail.subtotal),
          0,
        );

        return {
          id: payment.paymentId,
          referenceCode: payment.referenceCode,
          sourceReferenceCode: payment.order.referenceCode,
          entityName:
            `${payment.order.quotation.customer.firstNames} ${payment.order.quotation.customer.lastNames ?? ''}`.trim(),
          amount: amount.toFixed(2),
          status: payment.status,
          type: 'Pago',
          createdAt: payment.createdAt.toISOString(),
          paymentDetails: payment.paymentDetails.map((detail) => ({
            id: detail.paymentDetailId,
            paymentMethodName: detail.paymentMethod.name,
            amount: detail.subtotal,
            createdAt: detail.createdAt.toISOString(),
          })),
        };
      });

      const expenseRecords = expenses.map((expense) => ({
        id: expense.expenseId,
        referenceCode: expense.referenceCode,
        sourceReferenceCode: expense.financialCategory.name,
        entityName: expense.description ?? 'Sin descripción',
        amount: expense.total,
        status: 'Registrado',
        type: 'Gasto',
        createdAt: expense.createdAt.toISOString(),
      }));

      return [...paymentRecords, ...expenseRecords].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      );
    });
  }

  async listPaymentDetails(userId: string, paymentId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const payment = await manager.getRepository(PaymentEntity).findOne({
        where: { businessId: business.businessId, paymentId },
        relations: { paymentDetails: { paymentMethod: true } },
      });

      if (!payment) {
        throw new NotFoundException('Pago no encontrado');
      }

      return payment.paymentDetails
        .map((detail) => ({
          id: detail.paymentDetailId,
          paymentMethodName: detail.paymentMethod.name,
          amount: detail.subtotal,
          createdAt: detail.createdAt.toISOString(),
        }))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    });
  }

  async listPaymentMethods(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      return manager.getRepository(PaymentMethodEntity).find({
        where: { businessId: business.businessId },
        order: { name: 'ASC' },
      });
    });
  }

  async createPaymentMethod(userId: string, dto: CreatePaymentMethodDto) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const paymentMethodsRepository = manager.getRepository(PaymentMethodEntity);
      const normalizedName = dto.name.trim();

      const existingPaymentMethod = await this.findPaymentMethodByName(
        business.businessId,
        normalizedName,
        manager,
      );

      if (existingPaymentMethod) {
        throw new ConflictException('El método de pago ya está registrado');
      }

      return paymentMethodsRepository.save(
        paymentMethodsRepository.create({
          businessId: business.businessId,
          name: normalizedName,
        }),
      );
    });
  }

  async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    dto: UpdatePaymentMethodDto,
  ) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const paymentMethodsRepository = manager.getRepository(PaymentMethodEntity);
      const paymentMethod = await this.getPaymentMethodOrThrow(
        business.businessId,
        paymentMethodId,
        manager,
      );

      if (dto.name) {
        const normalizedName = dto.name.trim();
        const existingPaymentMethod = await this.findPaymentMethodByName(
          business.businessId,
          normalizedName,
          manager,
        );

        if (
          existingPaymentMethod &&
          existingPaymentMethod.paymentMethodId !== paymentMethod.paymentMethodId
        ) {
          throw new ConflictException('El método de pago ya está registrado');
        }

        paymentMethod.name = normalizedName;
      }

      return paymentMethodsRepository.save(paymentMethod);
    });
  }

  async deletePaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<void> {
    await this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      await this.getPaymentMethodOrThrow(
        business.businessId,
        paymentMethodId,
        manager,
      );

      const [paymentDetailsCount, expenseDetailsCount] = await Promise.all([
        manager.getRepository(PaymentDetailEntity).count({
          where: { businessId: business.businessId, paymentMethodId },
        }),
        manager.getRepository(ExpenseDetailEntity).count({
          where: { businessId: business.businessId, paymentMethodId },
        }),
      ]);

      if (paymentDetailsCount > 0 || expenseDetailsCount > 0) {
        throw new ConflictException(
          'No se puede eliminar el método de pago porque ya tiene registros asociados',
        );
      }

      await manager.getRepository(PaymentMethodEntity).delete({
        paymentMethodId,
        businessId: business.businessId,
      });
    });
  }

  async listFinancialCategories(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      return manager.getRepository(FinancialCategoryEntity).find({
        where: { businessId: business.businessId },
        order: { name: 'ASC' },
      });
    });
  }

  async createFinancialCategory(
    userId: string,
    dto: CreateFinancialCategoryDto,
  ) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const financialCategoriesRepository =
        manager.getRepository(FinancialCategoryEntity);
      const normalizedName = dto.name.trim();
      const existingCategory = await this.findFinancialCategoryByName(
        business.businessId,
        normalizedName,
        manager,
      );

      if (existingCategory) {
        throw new ConflictException(
          'La categoría financiera ya está registrada',
        );
      }

      return financialCategoriesRepository.save(
        financialCategoriesRepository.create({
          businessId: business.businessId,
          name: normalizedName,
        }),
      );
    });
  }

  async updateFinancialCategory(
    userId: string,
    financialCategoryId: string,
    dto: UpdateFinancialCategoryDto,
  ) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const financialCategoriesRepository =
        manager.getRepository(FinancialCategoryEntity);
      const financialCategory = await this.getFinancialCategoryOrThrow(
        business.businessId,
        financialCategoryId,
        manager,
      );

      if (dto.name) {
        const normalizedName = dto.name.trim();
        const existingCategory = await this.findFinancialCategoryByName(
          business.businessId,
          normalizedName,
          manager,
        );

        if (
          existingCategory &&
          existingCategory.financialCategoryId !==
            financialCategory.financialCategoryId
        ) {
          throw new ConflictException(
            'La categoría financiera ya está registrada',
          );
        }

        financialCategory.name = normalizedName;
      }

      return financialCategoriesRepository.save(financialCategory);
    });
  }

  async deleteFinancialCategory(
    userId: string,
    financialCategoryId: string,
  ): Promise<void> {
    await this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      await this.getFinancialCategoryOrThrow(
        business.businessId,
        financialCategoryId,
        manager,
      );

      const expensesCount = await manager.getRepository(ExpenseEntity).count({
        where: { businessId: business.businessId, financialCategoryId },
      });

      if (expensesCount > 0) {
        throw new ConflictException(
          'No se puede eliminar la categoría financiera porque ya tiene gastos asociados',
        );
      }

      await manager.getRepository(FinancialCategoryEntity).delete({
        financialCategoryId,
        businessId: business.businessId,
      });
    });
  }

  async createPayment(userId: string, dto: CreatePaymentDto) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const ordersRepository = manager.getRepository(OrderEntity);
      const paymentMethodsRepository = manager.getRepository(PaymentMethodEntity);
      const paymentsRepository = manager.getRepository(PaymentEntity);
      const paymentDetailsRepository = manager.getRepository(PaymentDetailEntity);
      const order = await ordersRepository.findOne({
        where: { orderId: dto.orderId, businessId: business.businessId },
        relations: { quotation: true, payment: { paymentDetails: true } },
      });

      if (!order) {
        throw new BadRequestException('Pedido no pertenece al negocio');
      }

      const paymentMethod = await paymentMethodsRepository.findOne({
        where: {
          paymentMethodId: dto.paymentMethodId,
          businessId: business.businessId,
        },
      });

      if (!paymentMethod) {
        throw new BadRequestException('Método de pago inválido');
      }

      const amount = Number(dto.amount);
      const paymentSummary = order.payment;

      if (!paymentSummary) {
        throw new BadRequestException(
          'El pedido no tiene un resumen de pago inicializado',
        );
      }

      if (amount <= 0) {
        throw new BadRequestException('El monto debe ser mayor a cero');
      }

      if (amount > Number(paymentSummary.remainingTotal)) {
        throw new BadRequestException('El abono supera el saldo pendiente');
      }

      const managedPayment = await paymentsRepository.findOneOrFail({
        where: {
          paymentId: paymentSummary.paymentId,
          businessId: business.businessId,
        },
      });

      const remainingTotal = Math.max(
        Number(managedPayment.remainingTotal) - amount,
        0,
      );

      managedPayment.remainingTotal = remainingTotal.toFixed(2);
      managedPayment.status =
        remainingTotal === 0 ? PaymentStatus.Paid : PaymentStatus.Advance;

      await paymentsRepository.save(managedPayment);

      await paymentDetailsRepository.save(
        paymentDetailsRepository.create({
          businessId: business.businessId,
          paymentId: managedPayment.paymentId,
          paymentMethodId: paymentMethod.paymentMethodId,
          subtotal: dto.amount,
        }),
      );

      await this.auditLogsService.createWithManager(manager, {
        actorUserId: userId,
        businessId: business.businessId,
        action: AuditAction.Update,
        tableName: 'payments',
        recordId: managedPayment.paymentId,
      });

      return {
        id: managedPayment.paymentId,
        referenceCode: managedPayment.referenceCode,
        status: managedPayment.status,
        remainingTotal: managedPayment.remainingTotal,
      };
    });
  }

  async createExpense(userId: string, dto: CreateExpenseDto) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const financialCategoriesRepository =
        manager.getRepository(FinancialCategoryEntity);
      const paymentMethodsRepository = manager.getRepository(PaymentMethodEntity);
      const expensesRepository = manager.getRepository(ExpenseEntity);
      const expenseDetailsRepository = manager.getRepository(ExpenseDetailEntity);
      const financialCategory = await financialCategoriesRepository.findOne({
        where: {
          financialCategoryId: dto.financialCategoryId,
          businessId: business.businessId,
        },
      });

      if (!financialCategory) {
        throw new BadRequestException('Categoría financiera inválida');
      }

      const paymentMethod = await paymentMethodsRepository.findOne({
        where: {
          paymentMethodId: dto.paymentMethodId,
          businessId: business.businessId,
        },
      });

      if (!paymentMethod) {
        throw new BadRequestException('Método de pago inválido');
      }

      const createdExpense = await expensesRepository.save(
        expensesRepository.create({
          businessId: business.businessId,
          financialCategoryId: financialCategory.financialCategoryId,
          description: dto.description?.trim() || null,
          total: dto.amount,
        }),
      );

      await expenseDetailsRepository.save(
        expenseDetailsRepository.create({
          businessId: business.businessId,
          expenseId: createdExpense.expenseId,
          paymentMethodId: paymentMethod.paymentMethodId,
          subtotal: dto.amount,
        }),
      );

      const expense = await expensesRepository.findOneOrFail({
        where: {
          expenseId: createdExpense.expenseId,
          businessId: business.businessId,
        },
      });

      await this.auditLogsService.createWithManager(manager, {
        actorUserId: userId,
        businessId: business.businessId,
        action: AuditAction.Create,
        tableName: 'expenses',
        recordId: expense.expenseId,
      });

      return {
        id: expense.expenseId,
        referenceCode: expense.referenceCode,
        total: expense.total,
      };
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

  private async getPaymentMethodOrThrow(
    businessId: string,
    paymentMethodId: string,
    manager?: EntityManager,
  ) {
    const paymentMethodsRepository =
      manager?.getRepository(PaymentMethodEntity) ?? this.paymentMethodsRepository;
    const paymentMethod = await paymentMethodsRepository.findOne({
      where: { paymentMethodId, businessId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Método de pago no encontrado');
    }

    return paymentMethod;
  }

  private async getFinancialCategoryOrThrow(
    businessId: string,
    financialCategoryId: string,
    manager?: EntityManager,
  ) {
    const financialCategoriesRepository =
      manager?.getRepository(FinancialCategoryEntity) ??
      this.financialCategoriesRepository;
    const financialCategory = await financialCategoriesRepository.findOne({
      where: { financialCategoryId, businessId },
    });

    if (!financialCategory) {
      throw new NotFoundException('Categoría financiera no encontrada');
    }

    return financialCategory;
  }

  private findPaymentMethodByName(
    businessId: string,
    name: string,
    manager?: EntityManager,
  ) {
    const paymentMethodsRepository =
      manager?.getRepository(PaymentMethodEntity) ?? this.paymentMethodsRepository;

    return paymentMethodsRepository
      .createQueryBuilder('paymentMethod')
      .where('paymentMethod.business_id = :businessId', { businessId })
      .andWhere('LOWER(paymentMethod.name) = LOWER(:name)', {
        name: name.trim(),
      })
      .getOne();
  }

  private findFinancialCategoryByName(
    businessId: string,
    name: string,
    manager?: EntityManager,
  ) {
    const financialCategoriesRepository =
      manager?.getRepository(FinancialCategoryEntity) ??
      this.financialCategoriesRepository;

    return financialCategoriesRepository
      .createQueryBuilder('financialCategory')
      .where('financialCategory.business_id = :businessId', { businessId })
      .andWhere('LOWER(financialCategory.name) = LOWER(:name)', {
        name: name.trim(),
      })
      .getOne();
  }
}
