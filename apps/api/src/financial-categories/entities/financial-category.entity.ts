import {
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
import { ExpenseEntity } from '../../expenses/entities/expense.entity';

@Entity({ name: 'financial_categories' })
@Unique('uq_financial_categories_business_name', ['businessId', 'name'])
@Unique('uq_financial_categories_id_business', [
  'financialCategoryId',
  'businessId',
])
export class FinancialCategoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'financial_category_id' })
  financialCategoryId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.financialCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => ExpenseEntity, (expense) => expense.financialCategory)
  expenses!: ExpenseEntity[];
}
