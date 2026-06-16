import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { ItemClass } from '../../database/database.enums';
import { ItemEntity } from './item.entity';

@Entity({ name: 'categories' })
@Unique('uq_categories_business_class_name', [
  'businessId',
  'itemClass',
  'categoryName',
])
@Unique('uq_categories_id_business_class', ['categoryId', 'businessId', 'itemClass'])
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'category_id' })
  categoryId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.categories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @Column({
    type: 'enum',
    name: 'item_class',
    enum: ItemClass,
    enumName: 'item_class_enum',
  })
  itemClass!: ItemClass;

  @Column({ type: 'varchar', name: 'category_name', length: 100 })
  categoryName!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => ItemEntity, (item) => item.category)
  items!: ItemEntity[];
}
