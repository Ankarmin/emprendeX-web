import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ItemEntity } from '../../catalog/entities/item.entity';
import { QuotationEntity } from './quotation.entity';

@Entity({ name: 'quotation_details' })
@Unique('uq_quotation_details_item', ['quotationId', 'itemId'])
@Check('chk_quotation_detail_quantity', '"quantity" > 0')
@Check('chk_quotation_detail_unit_price_non_negative', '"unit_price" >= 0')
@Check('chk_quotation_detail_discount_non_negative', '"discount" >= 0')
@Check(
  'chk_quotation_detail_discount_limit',
  '"discount" <= "quantity" * "unit_price"',
)
export class QuotationDetailEntity {
  @ApiProperty({
    description: 'Identificador único del detalle de cotización',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'quotation_detail_id' })
  quotationDetailId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ApiProperty({
    description: 'Identificador de la cotización',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'quotation_id' })
  quotationId!: string;

  @ApiProperty({
    description: 'Identificador del ítem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'item_id' })
  itemId!: string;

  @ManyToOne(() => QuotationEntity, (quotation) => quotation.quotationDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'quotation_id', referencedColumnName: 'quotationId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  quotation!: QuotationEntity;

  @ManyToOne(() => ItemEntity, (item) => item.quotationDetails)
  @JoinColumn([
    { name: 'item_id', referencedColumnName: 'itemId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  item!: ItemEntity;

  @ApiProperty({
    description: 'Cantidad del ítem',
    example: 3,
  })
  @Column({ type: 'integer', name: 'quantity', default: 1 })
  quantity!: number;

  @ApiProperty({
    description: 'Precio unitario del ítem',
    example: 49.99,
  })
  @Column({
    type: 'numeric',
    name: 'unit_price',
    precision: 10,
    scale: 2,
    default: 0,
  })
  unitPrice!: string;

  @ApiProperty({
    description: 'Descuento aplicado al ítem',
    example: 5.0,
  })
  @Column({
    type: 'numeric',
    name: 'discount',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discount!: string;

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
