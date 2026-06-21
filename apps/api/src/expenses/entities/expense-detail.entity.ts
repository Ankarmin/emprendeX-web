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
import { PaymentMethodEntity } from '../../payments/entities/payment-method.entity';
import { ExpenseEntity } from './expense.entity';

@Entity({ name: 'expense_details' })
@Check('chk_expense_detail_subtotal_positive', '"subtotal" > 0')
export class ExpenseDetailEntity {
  @ApiProperty({
    description: 'Identificador único del detalle de gasto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'expense_detail_id' })
  expenseDetailId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ApiProperty({
    description: 'Identificador del gasto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'expense_id' })
  expenseId!: string;

  @ApiProperty({
    description: 'Identificador del método de pago',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'payment_method_id' })
  paymentMethodId!: string;

  @ManyToOne(() => ExpenseEntity, (expense) => expense.expenseDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'expense_id', referencedColumnName: 'expenseId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  expense!: ExpenseEntity;

  @ManyToOne(
    () => PaymentMethodEntity,
    (paymentMethod) => paymentMethod.expenseDetails,
  )
  @JoinColumn([
    { name: 'payment_method_id', referencedColumnName: 'paymentMethodId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  paymentMethod!: PaymentMethodEntity;

  @ApiProperty({
    description: 'Subtotal del detalle de gasto',
    example: 125.00,
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
