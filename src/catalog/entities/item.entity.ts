import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Check,
} from 'typeorm';
import { ItemClass } from '../../database/database.enums';
import { ProductEntity } from './product.entity';
import { ProductosServiciosEntity } from './service.entity';
import { QuotationDetailEntity } from '../../quotations/entities/quotation-detail.entity';

@Entity({ name: 'items' })
@Check('chk_item_price_non_negative', '"price" >= 0')
export class ItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'item_id' })
  itemId!: string;

  @Column({
    type: 'enum',
    name: 'item_class',
    enum: ItemClass,
    enumName: 'item_class_enum',
  })
  itemClass!: ItemClass;

  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

  @Column({
    type: 'varchar',
    name: 'sku',
    length: 100,
    nullable: true,
    unique: true,
  })
  sku!: string | null;

  @Column({
    type: 'numeric',
    name: 'price',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToOne(() => ProductEntity, (product) => product.item)
  product!: ProductEntity | null;

  @OneToOne(() => ProductosServiciosEntity, (service) => service.item)
  service!: ProductosServiciosEntity | null;

  @OneToMany(
    () => QuotationDetailEntity,
    (quotationDetail) => quotationDetail.item,
  )
  quotationDetails!: QuotationDetailEntity[];
}
