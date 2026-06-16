import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { normalizeDni } from '../common/utils/dni.util';
import { RlsContextService } from '../database/rls/rls-context.service';
import { UsersService } from '../users/users.service';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QuotationEntity } from '../quotations/entities/quotation.entity';

@Injectable()
export class CustomersService {
  constructor(
    private readonly rlsContextService: RlsContextService,
    private readonly usersService: UsersService,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(QuotationEntity)
    private readonly quotationsRepository: Repository<QuotationEntity>,
  ) {}

  async list(userId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const customers = await manager.getRepository(Customer).find({
        where: { businessId: business.businessId },
        order: { createdAt: 'DESC' },
      });
      const operationsCountByCustomer = await this.getOperationsCountByCustomer(
        business.businessId,
        manager,
      );

      return customers.map((customer) =>
        this.mapCustomerSummary(
          customer,
          operationsCountByCustomer.get(customer.customerId) ?? 0,
        ),
      );
    });
  }

  async findOne(userId: string, customerId: string) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const customer = await manager.getRepository(Customer).findOne({
        where: { customerId, businessId: business.businessId },
      });

      if (!customer) {
        throw new NotFoundException('Cliente no encontrado');
      }

      const quotations = await manager.getRepository(QuotationEntity).find({
        where: { businessId: business.businessId, customerId },
        relations: { order: true },
        order: { createdAt: 'DESC' },
      });

      const operations = quotations.map((quotation) => {
        if (quotation.order) {
          return {
            id: quotation.order.orderId,
            referenceCode: quotation.order.referenceCode,
            type: 'Pedido',
            total: quotation.total,
            status: quotation.order.status,
            createdAt: quotation.order.createdAt.toISOString(),
          };
        }

        return {
          id: quotation.quotationId,
          referenceCode: quotation.referenceCode,
          type: 'Cotización',
          total: quotation.total,
          status: 'Pendiente',
          createdAt: quotation.createdAt.toISOString(),
        };
      });

      return {
        ...this.mapCustomerWithDni(customer, operations.length),
        operations,
      };
    });
  }

  async create(userId: string, dto: CreateCustomerDto) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const customersRepository = manager.getRepository(Customer);

      try {
        const customer = await customersRepository.save(
          customersRepository.create({
            businessId: business.businessId,
            firstNames: dto.firstNames.trim(),
            lastNames: dto.lastNames?.trim() || null,
            dni: normalizeDni(dto.dni),
            email: dto.email?.trim().toLowerCase() || null,
            phone: dto.phone?.trim() || null,
            address: dto.address?.trim() || null,
          }),
        );

        return this.mapCustomerWithDni(customer, 0);
      } catch (error) {
        if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
          throw new ConflictException(this.getUniqueViolationMessage(error));
        }

        throw error;
      }
    });
  }

  async update(userId: string, customerId: string, dto: UpdateCustomerDto) {
    return this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const customersRepository = manager.getRepository(Customer);
      const customer = await customersRepository.findOne({
        where: { customerId, businessId: business.businessId },
      });

      if (!customer) {
        throw new NotFoundException('Cliente no encontrado');
      }

      if (dto.firstNames !== undefined) {
        customer.firstNames = dto.firstNames.trim();
      }
      if (dto.dni !== undefined) {
        customer.dni = normalizeDni(dto.dni);
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

      try {
        const savedCustomer = await customersRepository.save(customer);
        const operationsCountByCustomer = await this.getOperationsCountByCustomer(
          business.businessId,
          manager,
        );

        return this.mapCustomerWithDni(
          savedCustomer,
          operationsCountByCustomer.get(savedCustomer.customerId) ?? 0,
        );
      } catch (error) {
        if (error instanceof QueryFailedError && this.isUniqueViolation(error)) {
          throw new ConflictException(this.getUniqueViolationMessage(error));
        }

        throw error;
      }
    });
  }

  async remove(userId: string, customerId: string): Promise<void> {
    await this.rlsContextService.runAsUser(userId, async (manager) => {
      const business = await this.getBusinessOrThrow(userId, manager);
      const customersRepository = manager.getRepository(Customer);
      const quotationsRepository = manager.getRepository(QuotationEntity);
      const customer = await customersRepository.findOne({
        where: { customerId, businessId: business.businessId },
      });

      if (!customer) {
        throw new NotFoundException('Cliente no encontrado');
      }

      const quotationsCount = await quotationsRepository.count({
        where: { businessId: business.businessId, customerId },
      });

      if (quotationsCount > 0) {
        throw new BadRequestException(
          'No se puede eliminar un cliente con operaciones asociadas',
        );
      }

      await customersRepository.delete({
        customerId,
        businessId: business.businessId,
      });
    });
  }

  private async getBusinessOrThrow(userId: string, manager?: EntityManager) {
    const business = await this.usersService.findPrimaryBusinessByUserId(
      userId,
      manager,
    );
    if (!business) {
      throw new BadRequestException('Business profile is not configured');
    }
    return business;
  }

  private mapCustomerSummary(customer: Customer, operationsCount: number) {
    return {
      id: customer.customerId,
      firstNames: customer.firstNames,
      lastNames: customer.lastNames,
      fullName: `${customer.firstNames} ${customer.lastNames ?? ''}`.trim(),
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      operationsCount,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }

  private mapCustomerWithDni(customer: Customer, operationsCount: number) {
    return {
      ...this.mapCustomerSummary(customer, operationsCount),
      dni: customer.dni,
    };
  }

  private async getOperationsCountByCustomer(
    businessId: string,
    manager?: EntityManager,
  ) {
    const quotationsRepository =
      manager?.getRepository(QuotationEntity) ?? this.quotationsRepository;
    const quotations = await quotationsRepository.find({
      where: { businessId },
      select: { customerId: true },
    });

    const operationsCountByCustomer = new Map<string, number>();
    for (const quotation of quotations) {
      const currentCount =
        operationsCountByCustomer.get(quotation.customerId) ?? 0;
      operationsCountByCustomer.set(quotation.customerId, currentCount + 1);
    }

    return operationsCountByCustomer;
  }

  private isUniqueViolation(error: {
    driverError?: { code?: string };
  }): boolean {
    return error.driverError?.code === '23505';
  }

  private getUniqueViolationMessage(error: {
    driverError?: { constraint?: string };
  }): string {
    switch (error.driverError?.constraint) {
      case 'uq_customers_business_dni':
        return 'El DNI del cliente ya existe en este negocio';
      case 'uq_customers_business_email':
      case 'uq_customers_business_phone':
        return 'El email o telefono del cliente ya existe en este negocio';
      default:
        return 'Ya existe un cliente con los mismos datos en este negocio';
    }
  }
}
