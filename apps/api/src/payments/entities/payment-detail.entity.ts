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
import { ApiProperty } from '@nestjs/swagger';
import { PaymentEntity } from './payment.entity';
import { PaymentMethodEntity } from './payment-method.entity';

@Entity({ name: 'payment_details' })
@Check('chk_payment_detail_subtotal_positive', '"subtotal" > 0')
export class PaymentDetailEntity {
  @ApiProperty({
    description: 'Identificador único del detalle de pago',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'payment_detail_id' })
  paymentDetailId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ApiProperty({
    description: 'Identificador del pago',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'payment_id' })
  paymentId!: string;

  @ApiProperty({
    description: 'Identificador del método de pago',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
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

  @ApiProperty({
    description: 'Subtotal del detalle de pago',
    example: 75.5,
  })
  @Column({ type: 'numeric', name: 'subtotal', precision: 10, scale: 2 })
  subtotal!: string;

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
}
