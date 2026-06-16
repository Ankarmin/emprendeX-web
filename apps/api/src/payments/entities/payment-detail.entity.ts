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
import { PaymentEntity } from './payment.entity';
import { PaymentMethodEntity } from './payment-method.entity';

@Entity({ name: 'payment_details' })
@Check('chk_payment_detail_subtotal_positive', '"subtotal" > 0')
export class PaymentDetailEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_detail_id' })
  paymentDetailId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId!: string;

  @Column({ type: 'uuid', name: 'payment_method_id' })
  paymentMethodId!: string;

  @ManyToOne(() => PaymentEntity, (payment) => payment.paymentDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'payment_id', referencedColumnName: 'paymentId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  payment!: PaymentEntity;

  @ManyToOne(
    () => PaymentMethodEntity,
    (paymentMethod) => paymentMethod.paymentDetails,
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
