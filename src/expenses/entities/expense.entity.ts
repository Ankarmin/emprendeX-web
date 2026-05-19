import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Check,
} from 'typeorm';
import { FinancialCategoryEntity } from '../../financial-categories/entities/financial-category.entity';
import { ExpenseDetailEntity } from './expense-detail.entity';

@Entity({ name: 'expenses' })
@Check('chk_expense_total_non_negative', '"total" >= 0')
export class ExpenseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'expense_id' })
  expenseId!: string;

  @Column({ type: 'uuid', name: 'financial_category_id' })
  financialCategoryId!: string;

  @ManyToOne(
    () => FinancialCategoryEntity,
    (financialCategory) => financialCategory.expenses,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({
    name: 'financial_category_id',
    referencedColumnName: 'financialCategoryId',
  })
  financialCategory!: FinancialCategoryEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

  @Column({ type: 'numeric', name: 'total', precision: 10, scale: 2 })
  total!: string;

  @Column({ type: 'varchar', name: 'reference_code', length: 100 })
  referenceCode!: string;

  @OneToMany(
    () => ExpenseDetailEntity,
    (expenseDetail) => expenseDetail.expense,
  )
  expenseDetails!: ExpenseDetailEntity[];
}
