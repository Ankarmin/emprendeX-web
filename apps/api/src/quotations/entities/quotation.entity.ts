import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Business } from '../../businesses/entities/business.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { DeliveryMethod, QuotationOrigin } from '../../database/database.enums';
import { OrderEntity } from '../../orders/entities/order.entity';
import { QuotationDetailEntity } from './quotation-detail.entity';

@Entity({ name: 'quotations' })
@Unique('uq_quotations_business_reference_code', [
  'businessId',
  'referenceCode',
])
@Unique('uq_quotations_id_business', ['quotationId', 'businessId'])
@Check('chk_quotation_total_non_negative', '"total" >= 0')
export class QuotationEntity {
  @ApiProperty({
    description: 'Identificador único de la cotización',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'quotation_id' })
  quotationId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.quotations)
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @ApiProperty({
    description: 'Identificador del cliente',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'customer_id' })
  customerId!: string;

  @ManyToOne(() => Customer, (customer) => customer.quotations)
  @JoinColumn([
    { name: 'customer_id', referencedColumnName: 'customerId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  customer!: Customer;

  @ApiProperty({
    description: 'Origen de la cotización',
    example: 'DIRECT',
  })
  @Column({
    type: 'enum',
    name: 'origin',
    enum: QuotationOrigin,
    enumName: 'quotation_origin_enum',
    default: QuotationOrigin.Internal,
  })
  origin!: QuotationOrigin;

  @ApiPropertyOptional({
    description: 'Descripción de la cotización',
    example: 'Cotización para servicios de consultoría',
  })
  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

  @ApiProperty({
    description: 'Fecha de entrega estimada',
    example: '2026-06-21T12:00:00.000Z',
  })
  @Column({ type: 'timestamptz', name: 'delivery_date' })
  deliveryDate!: Date;

  @ApiProperty({
    description: 'Método de entrega',
    example: 'DELIVERY',
  })
  @Column({
    type: 'enum',
    name: 'delivery_method',
    enum: DeliveryMethod,
    enumName: 'delivery_method_enum',
  })
  deliveryMethod!: DeliveryMethod;

  @ApiProperty({
    description: 'Total de la cotización',
    example: 199.99,
  })
  @Column({
    type: 'numeric',
    name: 'total',
    precision: 10,
    scale: 2,
    default: 0,
  })
  total!: string;

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
    () => QuotationDetailEntity,
    (quotationDetail) => quotationDetail.quotation,
  )
  quotationDetails!: QuotationDetailEntity[];

  @OneToOne(() => OrderEntity, (order) => order.quotation)
  order!: OrderEntity | null;
}
