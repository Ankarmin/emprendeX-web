import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ItemEntity } from '../../catalog/entities/item.entity';
import { QuotationEntity } from './quotation.entity';

@Entity({ name: 'quotation_details' })
export class QuotationDetailEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'quotation_detail_id' })
  quotationDetailId!: string;

  @Column({ type: 'uuid', name: 'quotation_id' })
  quotationId!: string;

  @Column({ type: 'uuid', name: 'item_id' })
  itemId!: string;

  @ManyToOne(() => QuotationEntity, (quotation) => quotation.quotationDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotation_id', referencedColumnName: 'quotationId' })
  quotation!: QuotationEntity;

  @ManyToOne(() => ItemEntity, (item) => item.quotationDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'item_id', referencedColumnName: 'itemId' })
  item!: ItemEntity;

  @Column({ type: 'integer', name: 'quantity' })
  quantity!: number;

  @Column({ type: 'numeric', name: 'discount', precision: 10, scale: 2 })
  discount!: string;
}
