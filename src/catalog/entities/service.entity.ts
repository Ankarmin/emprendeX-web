import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CategoryEntity } from './category.entity';
import { ItemEntity } from './item.entity';

@Entity({ name: 'services' })
export class ProductosServiciosEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'service_id' })
  serviceId!: string;

  @Column({ type: 'uuid', name: 'item_id', unique: true })
  itemId!: string;

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId!: string;

  @OneToOne(() => ItemEntity, (item) => item.service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id', referencedColumnName: 'itemId' })
  item!: ItemEntity;

  @ManyToOne(() => CategoryEntity, (category) => category.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id', referencedColumnName: 'categoryId' })
  category!: CategoryEntity;

  @Column({ type: 'varchar', name: 'reference_code', length: 100 })
  referenceCode!: string;
}
