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
  @PrimaryGeneratedColumn('uuid', { name: 'quotation_detail_id' })
  quotationDetailId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @Column({ type: 'uuid', name: 'quotation_id' })
  quotationId!: string;

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

  @Column({ type: 'integer', name: 'quantity', default: 1 })
  quantity!: number;

  @Column({
    type: 'numeric',
    name: 'unit_price',
    precision: 10,
    scale: 2,
    default: 0,
  })
  unitPrice!: string;

  @Column({
    type: 'numeric',
    name: 'discount',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discount!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
