import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ItemEntity } from './item.entity';
import { UnitEntity } from './unit.entity';

@Entity({ name: 'products' })
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'product_id' })
  productId!: string;

  @Column({ type: 'uuid', name: 'item_id', unique: true })
  itemId!: string;

  @Column({ type: 'uuid', name: 'unit_id' })
  unitId!: string;

  @OneToOne(() => ItemEntity, (item) => item.product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id', referencedColumnName: 'itemId' })
  item!: ItemEntity;

  @ManyToOne(() => UnitEntity, (unit) => unit.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id', referencedColumnName: 'unitId' })
  unit!: UnitEntity;

  @Column({ type: 'integer', name: 'stock', default: 1 })
  stock!: number;
}
