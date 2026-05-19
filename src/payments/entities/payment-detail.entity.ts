import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentMethodEntity } from './payment-method.entity';
import { PaymentEntity } from './payment.entity';

@Entity({ name: 'payment_details' })
export class PaymentDetailEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_detail_id' })
  paymentDetailId!: string;

  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId!: string;

  @Column({ type: 'uuid', name: 'payment_method_id' })
  paymentMethodId!: string;

  @ManyToOne(() => PaymentEntity, (payment) => payment.paymentDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_id', referencedColumnName: 'paymentId' })
  payment!: PaymentEntity;

  @ManyToOne(
    () => PaymentMethodEntity,
    (paymentMethod) => paymentMethod.paymentDetails,
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
