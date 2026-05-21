import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ExpenseDetailEntity } from '../expenses/entities/expense-detail.entity';
import { ExpenseEntity } from '../expenses/entities/expense.entity';
import { FinancialCategoryEntity } from '../financial-categories/entities/financial-category.entity';
import { PaymentDetailEntity } from '../payments/entities/payment-detail.entity';
import { PaymentMethodEntity } from '../payments/entities/payment-method.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { PaymentStatus } from '../database/database.enums';
import { OrderEntity } from '../orders/entities/order.entity';
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
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    @InjectRepository(PaymentEntity)
    private readonly paymentsRepository: Repository<PaymentEntity>,
    @InjectRepository(PaymentDetailEntity)
    private readonly paymentDetailsRepository: Repository<PaymentDetailEntity>,
    @InjectRepository(PaymentMethodEntity)
    private readonly paymentMethodsRepository: Repository<PaymentMethodEntity>,
    @InjectRepository(FinancialCategoryEntity)
    private readonly financialCategoriesRepository: Repository<FinancialCategoryEntity>,
    @InjectRepository(ExpenseEntity)
    private readonly expensesRepository: Repository<ExpenseEntity>,
    @InjectRepository(ExpenseDetailEntity)
    private readonly expenseDetailsRepository: Repository<ExpenseDetailEntity>,
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
  ) {}

  async getSummary(userId: string) {
    const business = await this.getBusinessOrThrow(userId);
    const payments = await this.paymentsRepository.find({
      where: {
        order: { quotation: { customer: { businessId: business.businessId } } },
      },
      relations: { paymentDetails: true },
    });
    const expenses = await this.expensesRepository.find({
      where: { financialCategory: { businessId: business.businessId } },
      relations: { expenseDetails: true },
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
  }

  async listRecords(userId: string) {
    const business = await this.getBusinessOrThrow(userId);
    const [payments, expenses] = await Promise.all([
      this.paymentsRepository.find({
        where: {
          order: {
            quotation: { customer: { businessId: business.businessId } },
          },
        },
        relations: {
          order: { quotation: { customer: true } },
          paymentDetails: { paymentMethod: true },
        },
        order: { createdAt: 'DESC' },
      }),
      this.expensesRepository.find({
        where: { financialCategory: { businessId: business.businessId } },
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
  }

  async listPaymentMethods(userId: string) {
    await this.getBusinessOrThrow(userId);
    return this.paymentMethodsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async createPaymentMethod(userId: string, dto: CreatePaymentMethodDto) {
    await this.getBusinessOrThrow(userId);
    const normalizedName = dto.name.trim();

    const existingPaymentMethod =
      await this.findPaymentMethodByName(normalizedName);

    if (existingPaymentMethod) {
      throw new ConflictException('El método de pago ya está registrado');
    }

    const paymentMethod = this.paymentMethodsRepository.create({
      name: normalizedName,
    });

    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    dto: UpdatePaymentMethodDto,
  ) {
    await this.getBusinessOrThrow(userId);
    const paymentMethod = await this.getPaymentMethodOrThrow(paymentMethodId);

    if (dto.name) {
      const normalizedName = dto.name.trim();
      const existingPaymentMethod =
        await this.findPaymentMethodByName(normalizedName);

      if (
        existingPaymentMethod &&
        existingPaymentMethod.paymentMethodId !== paymentMethod.paymentMethodId
      ) {
        throw new ConflictException('El método de pago ya está registrado');
      }

      paymentMethod.name = normalizedName;
    }

    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async deletePaymentMethod(
    userId: string,
    paymentMethodId: string,
  ): Promise<void> {
    await this.getBusinessOrThrow(userId);
    await this.getPaymentMethodOrThrow(paymentMethodId);

    const [paymentDetailsCount, expenseDetailsCount] = await Promise.all([
      this.paymentDetailsRepository.count({ where: { paymentMethodId } }),
      this.expenseDetailsRepository.count({ where: { paymentMethodId } }),
    ]);

    if (paymentDetailsCount > 0 || expenseDetailsCount > 0) {
      throw new ConflictException(
        'No se puede eliminar el método de pago porque ya tiene registros asociados',
      );
    }

    await this.paymentMethodsRepository.delete({ paymentMethodId });
  }

  async listFinancialCategories(userId: string) {
    const business = await this.getBusinessOrThrow(userId);
    return this.financialCategoriesRepository.find({
      where: { businessId: business.businessId },
      order: { name: 'ASC' },
    });
  }

  async createFinancialCategory(
    userId: string,
    dto: CreateFinancialCategoryDto,
  ) {
    const business = await this.getBusinessOrThrow(userId);
    const normalizedName = dto.name.trim();

    const existingCategory = await this.findFinancialCategoryByName(
      business.businessId,
      normalizedName,
    );

    if (existingCategory) {
      throw new ConflictException('La categoría financiera ya está registrada');
    }

    const financialCategory = this.financialCategoriesRepository.create({
      businessId: business.businessId,
      name: normalizedName,
    });

    return this.financialCategoriesRepository.save(financialCategory);
  }

  async updateFinancialCategory(
    userId: string,
    financialCategoryId: string,
    dto: UpdateFinancialCategoryDto,
  ) {
    const business = await this.getBusinessOrThrow(userId);
    const financialCategory = await this.getFinancialCategoryOrThrow(
      business.businessId,
      financialCategoryId,
    );

    if (dto.name) {
      const normalizedName = dto.name.trim();
      const existingCategory = await this.findFinancialCategoryByName(
        business.businessId,
        normalizedName,
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

    return this.financialCategoriesRepository.save(financialCategory);
  }

  async deleteFinancialCategory(
    userId: string,
    financialCategoryId: string,
  ): Promise<void> {
    const business = await this.getBusinessOrThrow(userId);
    await this.getFinancialCategoryOrThrow(
      business.businessId,
      financialCategoryId,
    );

    const expensesCount = await this.expensesRepository.count({
      where: { financialCategoryId },
    });

    if (expensesCount > 0) {
      throw new ConflictException(
        'No se puede eliminar la categoría financiera porque ya tiene gastos asociados',
      );
    }

    await this.financialCategoriesRepository.delete({
      financialCategoryId,
      businessId: business.businessId,
    });
  }

  async createPayment(userId: string, dto: CreatePaymentDto) {
    const business = await this.getBusinessOrThrow(userId);
    const order = await this.ordersRepository.findOne({
      where: {
        orderId: dto.orderId,
        quotation: { customer: { businessId: business.businessId } },
      },
      relations: { quotation: true },
    });
    if (!order) {
      throw new BadRequestException('Pedido no pertenece al negocio');
    }

    const paymentMethod = await this.paymentMethodsRepository.findOne({
      where: {
        paymentMethodId: dto.paymentMethodId,
      },
    });
    if (!paymentMethod) {
      throw new BadRequestException('Método de pago inválido');
    }

    const amount = Number(dto.amount);
    const paidAmount = await this.sumPaymentsForOrder(order.orderId);
    const remainingTotal = Math.max(
      Number(order.quotation.total) - paidAmount - amount,
      0,
    );
    const status =
      remainingTotal === 0
        ? PaymentStatus.Paid
        : paidAmount + amount > 0
          ? PaymentStatus.Advance
          : PaymentStatus.Unpaid;

    const payment = await this.dataSource.transaction(async (manager) => {
      const paymentRepository = manager.getRepository(PaymentEntity);
      const paymentDetailRepository =
        manager.getRepository(PaymentDetailEntity);
      const referenceCode = await this.generateNextReferenceCode(
        business.businessId,
        'PAG',
        'payments',
        manager,
      );

      const createdPayment = await paymentRepository.save(
        paymentRepository.create({
          orderId: order.orderId,
          status,
          remainingTotal: remainingTotal.toFixed(2),
          referenceCode,
        }),
      );

      await paymentDetailRepository.save(
        paymentDetailRepository.create({
          paymentId: createdPayment.paymentId,
          paymentMethodId: paymentMethod.paymentMethodId,
          subtotal: dto.amount,
        }),
      );

      return createdPayment;
    });

    return {
      id: payment.paymentId,
      referenceCode: payment.referenceCode,
      status: payment.status,
      remainingTotal: payment.remainingTotal,
    };
  }

  async createExpense(userId: string, dto: CreateExpenseDto) {
    const business = await this.getBusinessOrThrow(userId);
    const financialCategory = await this.financialCategoriesRepository.findOne({
      where: {
        financialCategoryId: dto.financialCategoryId,
        businessId: business.businessId,
      },
    });
    if (!financialCategory) {
      throw new BadRequestException('Categoría financiera inválida');
    }

    const paymentMethod = await this.paymentMethodsRepository.findOne({
      where: {
        paymentMethodId: dto.paymentMethodId,
      },
    });
    if (!paymentMethod) {
      throw new BadRequestException('Método de pago inválido');
    }

    const expense = await this.dataSource.transaction(async (manager) => {
      const expenseRepository = manager.getRepository(ExpenseEntity);
      const expenseDetailRepository =
        manager.getRepository(ExpenseDetailEntity);
      const referenceCode = await this.generateNextReferenceCode(
        business.businessId,
        'GAS',
        'expenses',
        manager,
      );

      const createdExpense = await expenseRepository.save(
        expenseRepository.create({
          financialCategoryId: financialCategory.financialCategoryId,
          description: dto.description?.trim() || null,
          total: dto.amount,
          referenceCode,
        }),
      );

      await expenseDetailRepository.save(
        expenseDetailRepository.create({
          expenseId: createdExpense.expenseId,
          paymentMethodId: paymentMethod.paymentMethodId,
          subtotal: dto.amount,
        }),
      );

      return createdExpense;
    });

    return {
      id: expense.expenseId,
      referenceCode: expense.referenceCode,
      total: expense.total,
    };
  }

  private async getBusinessOrThrow(userId: string) {
    const business =
      await this.usersService.findPrimaryBusinessByUserId(userId);
    if (!business) {
      throw new BadRequestException('Business profile is not configured');
    }
    return business;
  }

  private async getPaymentMethodOrThrow(paymentMethodId: string) {
    const paymentMethod = await this.paymentMethodsRepository.findOne({
      where: { paymentMethodId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Método de pago no encontrado');
    }

    return paymentMethod;
  }

  private async getFinancialCategoryOrThrow(
    businessId: string,
    financialCategoryId: string,
  ) {
    const financialCategory = await this.financialCategoriesRepository.findOne({
      where: { financialCategoryId, businessId },
    });

    if (!financialCategory) {
      throw new NotFoundException('Categoría financiera no encontrada');
    }

    return financialCategory;
  }

  private findPaymentMethodByName(name: string) {
    return this.paymentMethodsRepository
      .createQueryBuilder('paymentMethod')
      .where('LOWER(paymentMethod.name) = LOWER(:name)', {
        name: name.trim(),
      })
      .getOne();
  }

  private findFinancialCategoryByName(businessId: string, name: string) {
    return this.financialCategoriesRepository
      .createQueryBuilder('financialCategory')
      .where('financialCategory.business_id = :businessId', { businessId })
      .andWhere('LOWER(financialCategory.name) = LOWER(:name)', {
        name: name.trim(),
      })
      .getOne();
  }

  private async sumPaymentsForOrder(orderId: string) {
    const payments = await this.paymentsRepository.find({
      where: { orderId },
      relations: { paymentDetails: true },
    });

    return payments.reduce(
      (sum, payment) =>
        sum +
        payment.paymentDetails.reduce(
          (detailSum, detail) => detailSum + Number(detail.subtotal),
          0,
        ),
      0,
    );
  }

  private async generateNextReferenceCode(
    businessId: string,
    prefix: 'PAG' | 'GAS',
    tableName: 'payments' | 'expenses',
    manager: EntityManager,
  ) {
    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `${businessId}:${prefix}`,
    ]);

    const [row] = await manager.query<
      { lastReferenceNumber: number | string | null }[]
    >(
      tableName === 'payments'
        ? `
            SELECT COALESCE(
              MAX(CAST(SUBSTRING(p.reference_code FROM '${prefix}-(\\d+)$') AS INTEGER)),
              0
            ) AS "lastReferenceNumber"
            FROM "payments" p
            INNER JOIN "orders" o ON o."order_id" = p."order_id"
            INNER JOIN "quotations" q ON q."quotation_id" = o."quotation_id"
            INNER JOIN "customers" c ON c."customer_id" = q."customer_id"
            WHERE c."business_id" = $1
          `
        : `
            SELECT COALESCE(
              MAX(CAST(SUBSTRING(e.reference_code FROM '${prefix}-(\\d+)$') AS INTEGER)),
              0
            ) AS "lastReferenceNumber"
            FROM "expenses" e
            INNER JOIN "financial_categories" fc ON fc."financial_category_id" = e."financial_category_id"
            WHERE fc."business_id" = $1
          `,
      [businessId],
    );

    return `${prefix}-${Number(row?.lastReferenceNumber ?? 0) + 1}`;
  }
}
