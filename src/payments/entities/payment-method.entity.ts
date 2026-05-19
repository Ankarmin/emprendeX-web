import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ExpenseDetailEntity } from '../../expenses/entities/expense-detail.entity';
import { PaymentDetailEntity } from './payment-detail.entity';

@Entity({ name: 'payment_methods' })
export class PaymentMethodEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_method_id' })
  paymentMethodId!: string;

  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

  @OneToMany(
    () => PaymentDetailEntity,
    (paymentDetail) => paymentDetail.paymentMethod,
  )
  paymentDetails!: PaymentDetailEntity[];

  @OneToMany(
    () => ExpenseDetailEntity,
    (expenseDetail) => expenseDetail.paymentMethod,
  )
  expenseDetails!: ExpenseDetailEntity[];
}
