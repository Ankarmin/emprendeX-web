import {
  Check,
  CreateDateColumn,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AuditLogEntity } from '../../audit-logs/entities/audit-log.entity';
import { User } from '../../users/entities/user.entity';
import { BusinessModule } from './business-module.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { CategoryEntity } from '../../catalog/entities/category.entity';
import { ExpenseEntity } from '../../expenses/entities/expense.entity';
import { FinancialCategoryEntity } from '../../financial-categories/entities/financial-category.entity';
import { ItemEntity } from '../../catalog/entities/item.entity';
import { PaymentMethodEntity } from '../../payments/entities/payment-method.entity';
import { QuotationEntity } from '../../quotations/entities/quotation.entity';
import { UnitEntity } from '../../catalog/entities/unit.entity';
import { BusinessPreferencesEntity } from './business-preferences.entity';

@Entity({ name: 'businesses' })
@Unique('uq_businesses_user', ['userId'])
@Unique('uq_businesses_user_name', ['userId', 'businessName'])
@Unique('uq_businesses_public_catalog_slug', ['publicCatalogSlug'])
@Unique('uq_businesses_id_user', ['businessId', 'userId'])
@Check('chk_businesses_name_not_blank', `btrim(business_name) <> ''`)
@Check('chk_businesses_category_not_blank', `btrim(business_category) <> ''`)
@Check(
  'chk_businesses_public_catalog_slug_format',
  `"public_catalog_slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
)
export class Business {
  @PrimaryGeneratedColumn('uuid', { name: 'business_id' })
  businessId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.businesses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user!: User;

  @Column({ type: 'varchar', name: 'business_name', length: 100 })
  businessName!: string;

  @Column({ type: 'varchar', name: 'business_category', length: 100 })
  businessCategory!: string;

  @Column({ type: 'varchar', name: 'public_catalog_slug', length: 120 })
  publicCatalogSlug!: string;

  @Column({ type: 'boolean', name: 'catalog_is_public', default: true })
  catalogIsPublic!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Customer, (customer) => customer.business)
  customers!: Customer[];

  @OneToOne(
    () => BusinessPreferencesEntity,
    (preferences) => preferences.business,
  )
  preferences!: BusinessPreferencesEntity | null;

  @OneToMany(() => BusinessModule, (businessModule) => businessModule.business)
  businessModules!: BusinessModule[];

  @OneToMany(() => UnitEntity, (unit) => unit.business)
  units!: UnitEntity[];

  @OneToMany(() => CategoryEntity, (category) => category.business)
  categories!: CategoryEntity[];

  @OneToMany(
    () => FinancialCategoryEntity,
    (financialCategory) => financialCategory.business,
  )
  financialCategories!: FinancialCategoryEntity[];

  @OneToMany(() => ItemEntity, (item) => item.business)
  items!: ItemEntity[];

  @OneToMany(
    () => PaymentMethodEntity,
    (paymentMethod) => paymentMethod.business,
  )
  paymentMethods!: PaymentMethodEntity[];

  @OneToMany(() => QuotationEntity, (quotation) => quotation.business)
  quotations!: QuotationEntity[];

  @OneToMany(() => ExpenseEntity, (expense) => expense.business)
  expenses!: ExpenseEntity[];

  @OneToMany(() => AuditLogEntity, (auditLog) => auditLog.business)
  auditLogs!: AuditLogEntity[];
}
