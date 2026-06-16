import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethodEntity } from '../../payments/entities/payment-method.entity';
import { ExpenseEntity } from './expense.entity';

@Entity({ name: 'expense_details' })
@Check('chk_expense_detail_subtotal_positive', '"subtotal" > 0')
export class ExpenseDetailEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'expense_detail_id' })
  expenseDetailId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @Column({ type: 'uuid', name: 'expense_id' })
  expenseId!: string;

  @Column({ type: 'uuid', name: 'payment_method_id' })
  paymentMethodId!: string;

  @ManyToOne(() => ExpenseEntity, (expense) => expense.expenseDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'expense_id', referencedColumnName: 'expenseId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  expense!: ExpenseEntity;

  @ManyToOne(
    () => PaymentMethodEntity,
    (paymentMethod) => paymentMethod.expenseDetails,
  )
  @JoinColumn([
    { name: 'payment_method_id', referencedColumnName: 'paymentMethodId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  paymentMethod!: PaymentMethodEntity;

  @Column({ type: 'numeric', name: 'subtotal', precision: 10, scale: 2 })
  subtotal!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
