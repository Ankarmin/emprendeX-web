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
import { ExpenseDetailEntity } from '../../expenses/entities/expense-detail.entity';
import { PaymentDetailEntity } from './payment-detail.entity';

@Entity({ name: 'payment_methods' })
@Unique('uq_payment_methods_business_name', ['businessId', 'name'])
@Unique('uq_payment_methods_id_business', ['paymentMethodId', 'businessId'])
export class PaymentMethodEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_method_id' })
  paymentMethodId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.paymentMethods, {
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
