import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { ExpenseDetailEntity } from '../../expenses/entities/expense-detail.entity';
import { PaymentDetailEntity } from './payment-detail.entity';

@Entity({ name: 'payment_methods' })
@Unique('uq_business_payment_method', ['businessId', 'name'])
export class PaymentMethodEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_method_id' })
  paymentMethodId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

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
