import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../database/database.enums';
import { PaymentEntity } from '../../payments/entities/payment.entity';
import { QuotationEntity } from '../../quotations/entities/quotation.entity';

@Entity({ name: 'orders' })
@Unique('uq_orders_quotation', ['quotationId'])
@Unique('uq_orders_business_reference_code', ['businessId', 'referenceCode'])
@Unique('uq_orders_id_business', ['orderId', 'businessId'])
export class OrderEntity {
  @ApiProperty({
    description: 'Identificador único del pedido',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'order_id' })
  orderId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ApiProperty({
    description: 'Identificador de la cotización asociada',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'quotation_id' })
  quotationId!: string;

  @OneToOne(() => QuotationEntity, (quotation) => quotation.order)
  @JoinColumn([
    { name: 'quotation_id', referencedColumnName: 'quotationId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  quotation!: QuotationEntity;

  @ApiProperty({
    description: 'Estado del pedido',
    example: 'pending',
  })
  @Column({
    type: 'enum',
    name: 'status',
    enum: OrderStatus,
    enumName: 'order_status_enum',
    default: OrderStatus.Pending,
  })
  status!: OrderStatus;

  @ApiPropertyOptional({
    description: 'Notas adicionales del pedido',
    example: 'Entregar en horario de oficina',
  })
  @Column({ type: 'text', name: 'notes', nullable: true })
  notes!: string | null;

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

  @OneToOne(() => PaymentEntity, (payment) => payment.order)
  payment!: PaymentEntity | null;
}
