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
import { ApiProperty } from '@nestjs/swagger';
import { Business } from '../../businesses/entities/business.entity';
import { ExpenseDetailEntity } from '../../expenses/entities/expense-detail.entity';
import { PaymentDetailEntity } from './payment-detail.entity';

@Entity({ name: 'payment_methods' })
@Unique('uq_payment_methods_business_name', ['businessId', 'name'])
@Unique('uq_payment_methods_id_business', ['paymentMethodId', 'businessId'])
export class PaymentMethodEntity {
  @ApiProperty({
    description: 'Identificador único del método de pago',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'payment_method_id' })
  paymentMethodId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.paymentMethods, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @ApiProperty({
    description: 'Nombre del método de pago',
    example: 'Efectivo',
  })
  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

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
    (paymentDetail) => paymentDetail.paymentMethod,
  )
  paymentDetails!: PaymentDetailEntity[];

  @OneToMany(
    () => ExpenseDetailEntity,
    (expenseDetail) => expenseDetail.paymentMethod,
  )
  expenseDetails!: ExpenseDetailEntity[];
}
