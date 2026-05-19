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
import { PaymentStatus } from '../../database/database.enums';
import { OrderEntity } from '../../orders/entities/order.entity';
import { PaymentDetailEntity } from './payment-detail.entity';

@Entity({ name: 'payments' })
@Check('chk_payment_remaining_total_non_negative', '"remaining_total" >= 0')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
  paymentId!: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => OrderEntity, (order) => order.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id', referencedColumnName: 'orderId' })
  order!: OrderEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @Column({
    type: 'enum',
    name: 'status',
    enum: PaymentStatus,
    enumName: 'payment_status_enum',
  })
  status!: PaymentStatus;

  @Column({
    type: 'numeric',
    name: 'remaining_total',
    precision: 10,
    scale: 2,
  })
  remainingTotal!: string;

  @Column({ type: 'varchar', name: 'reference_code', length: 100 })
  referenceCode!: string;

  @OneToMany(
    () => PaymentDetailEntity,
    (paymentDetail) => paymentDetail.payment,
  )
  paymentDetails!: PaymentDetailEntity[];
}
