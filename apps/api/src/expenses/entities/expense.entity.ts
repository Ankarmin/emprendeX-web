import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { FinancialCategoryEntity } from '../../financial-categories/entities/financial-category.entity';
import { ExpenseDetailEntity } from './expense-detail.entity';

@Entity({ name: 'expenses' })
@Unique('uq_expenses_business_reference_code', ['businessId', 'referenceCode'])
@Unique('uq_expenses_id_business', ['expenseId', 'businessId'])
@Check('chk_expense_total_positive', '"total" > 0')
export class ExpenseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'expense_id' })
  expenseId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.expenses)
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @Column({ type: 'uuid', name: 'financial_category_id' })
  financialCategoryId!: string;

  @ManyToOne(
    () => FinancialCategoryEntity,
    (financialCategory) => financialCategory.expenses,
  )
  @JoinColumn([
    {
      name: 'financial_category_id',
      referencedColumnName: 'financialCategoryId',
    },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  financialCategory!: FinancialCategoryEntity;

  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

  @Column({ type: 'numeric', name: 'total', precision: 10, scale: 2 })
  total!: string;

  @Column({
    type: 'varchar',
    name: 'reference_code',
    length: 100,
    insert: false,
    update: false,
  })
  referenceCode!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(
    () => ExpenseDetailEntity,
    (expenseDetail) => expenseDetail.expense,
  )
  expenseDetails!: ExpenseDetailEntity[];
}
