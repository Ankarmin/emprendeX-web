import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../../database/database.enums';
import { OrderEntity } from '../../orders/entities/order.entity';
import { PaymentDetailEntity } from './payment-detail.entity';

@Entity({ name: 'payments' })
@Unique('uq_payments_order', ['orderId'])
@Unique('uq_payments_business_reference_code', ['businessId', 'referenceCode'])
@Unique('uq_payments_id_business', ['paymentId', 'businessId'])
@Check('chk_payment_remaining_total_non_negative', '"remaining_total" >= 0')
export class PaymentEntity {
  @ApiProperty({
    description: 'Identificador único del pago',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
  paymentId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ApiProperty({
    description: 'Identificador del pedido asociado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  @OneToOne(() => OrderEntity, (order) => order.payment)
  @JoinColumn([
    { name: 'order_id', referencedColumnName: 'orderId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  order!: OrderEntity;

  @ApiProperty({
    description: 'Estado del pago',
    example: 'pending',
  })
  @Column({
    type: 'enum',
    name: 'status',
    enum: PaymentStatus,
    enumName: 'payment_status_enum',
    default: PaymentStatus.Unpaid,
  })
  status!: PaymentStatus;

  @ApiProperty({
    description: 'Total pendiente por pagar',
    example: 150.00,
  })
  @Column({
    type: 'numeric',
    name: 'remaining_total',
    precision: 10,
    scale: 2,
  })
  remainingTotal!: string;

  @Column({
    type: 'varchar',
    name: 'reference_code',
    length: 100,
    insert: false,
    update: false,
  })
  referenceCode!: string;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2026-06-21T12:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del registro',
    example: '2026-06-21T12:00:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(
    () => PaymentDetailEntity,
    (paymentDetail) => paymentDetail.payment,
  )
  paymentDetails!: PaymentDetailEntity[];
}
