import { Business } from '../businesses/entities/business.entity';
import { BusinessModule } from '../businesses/entities/business-module.entity';
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
  Customer,
  FeatureModuleEntity,
  BusinessModule,
];
