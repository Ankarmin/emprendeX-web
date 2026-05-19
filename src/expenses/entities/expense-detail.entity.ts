import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentMethodEntity } from '../../payments/entities/payment-method.entity';
import { ExpenseEntity } from './expense.entity';

@Entity({ name: 'expense_details' })
export class ExpenseDetailEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'expense_detail_id' })
  expenseDetailId!: string;

  @Column({ type: 'uuid', name: 'expense_id' })
  expenseId!: string;

  @Column({ type: 'uuid', name: 'payment_method_id' })
  paymentMethodId!: string;

  @ManyToOne(() => ExpenseEntity, (expense) => expense.expenseDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expense_id', referencedColumnName: 'expenseId' })
  expense!: ExpenseEntity;

  @ManyToOne(
    () => PaymentMethodEntity,
    (paymentMethod) => paymentMethod.expenseDetails,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({
    name: 'payment_method_id',
    referencedColumnName: 'paymentMethodId',
  })
  paymentMethod!: PaymentMethodEntity;

  @Column({ type: 'numeric', name: 'subtotal', precision: 10, scale: 2 })
  subtotal!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
