import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ItemClass } from '../../database/database.enums';
import { ItemEntity } from './item.entity';

@Entity({ name: 'products' })
@Check('chk_product_item_class', `"item_class" = 'Producto'`)
@Check('chk_product_stock_non_negative', '"stock" >= 0')
export class ProductEntity {
  @PrimaryColumn({ type: 'uuid', name: 'item_id' })
  itemId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @Column({
    type: 'enum',
    name: 'item_class',
    enum: ItemClass,
    enumName: 'item_class_enum',
    default: ItemClass.Product,
  })
  itemClass!: ItemClass;

  @OneToOne(() => ItemEntity, (item) => item.product, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'item_id', referencedColumnName: 'itemId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
    { name: 'item_class', referencedColumnName: 'itemClass' },
  ])
  item!: ItemEntity;

  @Column({ type: 'integer', name: 'stock', default: 0 })
  stock!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
