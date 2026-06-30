import { AuditLogEntity } from '../audit-logs/entities/audit-log.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessModule } from '../businesses/entities/business-module.entity';
import { BusinessPreferencesEntity } from '../businesses/entities/business-preferences.entity';
import { CategoryEntity } from '../catalog/entities/category.entity';
import { ItemEntity } from '../catalog/entities/item.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { ServiceEntity } from '../catalog/entities/service.entity';
import { UnitEntity } from '../catalog/entities/unit.entity';
import { Customer } from '../customers/entities/customer.entity';
import { ExpenseDetailEntity } from '../expenses/entities/expense-detail.entity';
import { ExpenseEntity } from '../expenses/entities/expense.entity';
import { FinancialCategoryEntity } from '../financial-categories/entities/financial-category.entity';
import { FeatureModuleEntity } from '../modules/entities/feature-module.entity';
import { OrderEntity } from '../orders/entities/order.entity';
import { PaymentDetailEntity } from '../payments/entities/payment-detail.entity';
import { PaymentMethodEntity } from '../payments/entities/payment-method.entity';
import { PaymentEntity } from '../payments/entities/payment.entity';
import { Plan } from '../plans/entities/plan.entity';
import { PlanPrice } from '../plans/entities/plan-price.entity';
import { QuotationDetailEntity } from '../quotations/entities/quotation-detail.entity';
import { QuotationEntity } from '../quotations/entities/quotation.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';

export const databaseEntities = [
  AuditLogEntity,
  User,
  Plan,
  PlanPrice,
  Subscription,
  Business,
  BusinessPreferencesEntity,
  UnitEntity,
  CategoryEntity,
  Customer,
  FinancialCategoryEntity,
  ExpenseEntity,
  ExpenseDetailEntity,
  FeatureModuleEntity,
  BusinessModule,
  ItemEntity,
  ProductEntity,
  ServiceEntity,
  QuotationEntity,
  QuotationDetailEntity,
  OrderEntity,
  PaymentMethodEntity,
  PaymentEntity,
  PaymentDetailEntity,
];
