import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../orders/entities/order.entity';
import { QuotationEntity } from '../quotations/entities/quotation.entity';
import { UsersService } from '../users/users.service';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(QuotationEntity)
    private readonly quotationsRepository: Repository<QuotationEntity>,
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
  ) {}

  async list(userId: string) {
    const business = await this.getBusinessOrThrow(userId);
    const customers = await this.customersRepository.find({
      where: { businessId: business.businessId },
      order: { createdAt: 'DESC' },
    });

    const operationsCountByCustomer = await this.getOperationsCountByCustomer(
      business.businessId,
    );

    return customers.map((customer) =>
      this.mapCustomerSummary(
        customer,
        operationsCountByCustomer.get(customer.customerId) ?? 0,
      ),
    );
  }

  async findOne(userId: string, customerId: string) {
    const business = await this.getBusinessOrThrow(userId);
    const customer = await this.customersRepository.findOne({
      where: { customerId, businessId: business.businessId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const quotations = await this.quotationsRepository.find({
      where: { customerId },
      relations: { orders: true },
      order: { createdAt: 'DESC' },
    });

    const operations = quotations.flatMap((quotation) => {
      if (quotation.orders.length > 0) {
        return quotation.orders.map((order) => ({
          id: order.orderId,
          referenceCode: order.referenceCode,
          type: 'Pedido',
          total: quotation.total,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
        }));
      }

      return [
        {
          id: quotation.quotationId,
          referenceCode: quotation.referenceCode,
          type: 'Cotización',
          total: quotation.total,
          status: 'Pendiente',
          createdAt: quotation.createdAt.toISOString(),
        },
      ];
    });

    return {
      ...this.mapCustomerSummary(customer, operations.length),
      operations,
    };
  }

  async create(userId: string, dto: CreateCustomerDto) {
    const business = await this.getBusinessOrThrow(userId);
    const customer = this.customersRepository.create({
      businessId: business.businessId,
      firstNames: dto.firstNames.trim(),
      lastNames: dto.lastNames?.trim() || null,
      email: dto.email?.trim().toLowerCase() || null,
      phone: dto.phone?.trim() || null,
      address: dto.address?.trim() || null,
    });

    const savedCustomer = await this.customersRepository.save(customer);
    return this.mapCustomerSummary(savedCustomer, 0);
  }

  async update(userId: string, customerId: string, dto: UpdateCustomerDto) {
    const business = await this.getBusinessOrThrow(userId);
    const customer = await this.customersRepository.findOne({
      where: { customerId, businessId: business.businessId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (dto.firstNames !== undefined) {
      customer.firstNames = dto.firstNames.trim();
    }
    if (dto.lastNames !== undefined) {
      customer.lastNames = dto.lastNames.trim() || null;
    }
    if (dto.email !== undefined) {
      customer.email = dto.email.trim().toLowerCase() || null;
    }
    if (dto.phone !== undefined) {
      customer.phone = dto.phone.trim() || null;
    }
    if (dto.address !== undefined) {
      customer.address = dto.address.trim() || null;
    }

    const savedCustomer = await this.customersRepository.save(customer);
    const operationsCountByCustomer = await this.getOperationsCountByCustomer(
      business.businessId,
    );

    return this.mapCustomerSummary(
      savedCustomer,
      operationsCountByCustomer.get(savedCustomer.customerId) ?? 0,
    );
  }

  async remove(userId: string, customerId: string): Promise<void> {
    const business = await this.getBusinessOrThrow(userId);
    const customer = await this.customersRepository.findOne({
      where: { customerId, businessId: business.businessId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const quotationsCount = await this.quotationsRepository.count({
      where: { customerId },
    });

    if (quotationsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar un cliente con operaciones asociadas',
      );
    }

    await this.customersRepository.delete({ customerId });
  }

  private async getBusinessOrThrow(userId: string) {
    const business =
      await this.usersService.findPrimaryBusinessByUserId(userId);
    if (!business) {
      throw new BadRequestException('Business profile is not configured');
    }
    return business;
  }

  private mapCustomerSummary(customer: Customer, operationsCount: number) {
    const fullName =
      `${customer.firstNames} ${customer.lastNames ?? ''}`.trim();

    return {
      id: customer.customerId,
      firstNames: customer.firstNames,
      lastNames: customer.lastNames,
      fullName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      operationsCount,
      createdAt: customer.createdAt.toISOString(),
    };
  }

  private async getOperationsCountByCustomer(businessId: string) {
    const quotations = await this.quotationsRepository.find({
      where: { customer: { businessId } },
      relations: { customer: true },
    });

    const operationsCountByCustomer = new Map<string, number>();
    for (const quotation of quotations) {
      const currentCount =
        operationsCountByCustomer.get(quotation.customerId) ?? 0;
      operationsCountByCustomer.set(quotation.customerId, currentCount + 1);
    }

    return operationsCountByCustomer;
  }
}
