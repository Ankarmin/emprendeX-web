import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { ExpenseEntity } from '../../expenses/entities/expense.entity';

@Entity({ name: 'financial_categories' })
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

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => ExpenseEntity, (expense) => expense.financialCategory)
  expenses!: ExpenseEntity[];
}
