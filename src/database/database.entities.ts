import { Business } from '../businesses/entities/business.entity';
import { BusinessModule } from '../businesses/entities/business-module.entity';
import { CategoryEntity } from '../catalog/entities/category.entity';
import { ItemEntity } from '../catalog/entities/item.entity';
import { ProductEntity } from '../catalog/entities/product.entity';
import { ProductosServiciosEntity } from '../catalog/entities/service.entity';
import { UnitEntity } from '../catalog/entities/unit.entity';
import { Customer } from '../customers/entities/customer.entity';
import { FeatureModuleEntity } from '../modules/entities/feature-module.entity';
import { Plan } from '../plans/entities/plan.entity';
import { PlanPrice } from '../plans/entities/plan-price.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';

export const databaseEntities = [
  User,
  Plan,
  PlanPrice,
  Subscription,
  Business,
  UnitEntity,
  CategoryEntity,
  Customer,
  FeatureModuleEntity,
  BusinessModule,
  ItemEntity,
  ProductEntity,
  ProductosServiciosEntity,
];
