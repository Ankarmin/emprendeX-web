import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { ItemClass } from '../../database/database.enums';
import { ProductEntity } from './product.entity';
import { ServiceEntity } from './service.entity';
import { QuotationDetailEntity } from '../../quotations/entities/quotation-detail.entity';
import { CategoryEntity } from './category.entity';
import { UnitEntity } from './unit.entity';

@Entity({ name: 'items' })
@Unique('uq_items_business_reference_code', ['businessId', 'referenceCode'])
@Unique('uq_items_id_business', ['itemId', 'businessId'])
@Unique('uq_items_id_business_class', ['itemId', 'businessId', 'itemClass'])
@Index('uq_items_business_sku', ['businessId', 'sku'], {
  unique: true,
  where: 'sku IS NOT NULL',
})
@Check('chk_item_price_non_negative', '"price" >= 0')
@Check('chk_item_name_not_blank', "btrim(name) <> ''")
@Check('chk_item_sku_not_blank', "sku IS NULL OR btrim(sku) <> ''")
@Check(
  'chk_item_image_url_https',
  `image_url IS NULL OR image_url ~* '^https://[^[:space:]<>''"]+$'`,
)
export class ItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'item_id' })
  itemId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.items, {
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

  @Column({ type: 'uuid', name: 'category_id' })
  categoryId!: string;

  @ManyToOne(() => CategoryEntity, (category) => category.items)
  @JoinColumn([
    { name: 'category_id', referencedColumnName: 'categoryId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
    { name: 'item_class', referencedColumnName: 'itemClass' },
  ])
  category!: CategoryEntity;

  @Column({ type: 'uuid', name: 'unit_id' })
  unitId!: string;

  @ManyToOne(() => UnitEntity, (unit) => unit.items)
  @JoinColumn([
    { name: 'unit_id', referencedColumnName: 'unitId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
    { name: 'item_class', referencedColumnName: 'itemClass' },
  ])
  unit!: UnitEntity;

  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

  @Column({
    type: 'varchar',
    name: 'sku',
    length: 100,
    nullable: true,
  })
  sku!: string | null;

  @Column({
    type: 'varchar',
    name: 'reference_code',
    length: 100,
    insert: false,
    update: false,
  })
  referenceCode!: string;

  @Column({ type: 'varchar', name: 'image_url', length: 2048, nullable: true })
  imageUrl!: string | null;

  @Column({
    type: 'numeric',
    name: 'price',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => ProductEntity, (product) => product.item)
  product!: ProductEntity | null;

  @OneToOne(() => ServiceEntity, (service) => service.item)
  service!: ServiceEntity | null;

  @OneToMany(
    () => QuotationDetailEntity,
    (quotationDetail) => quotationDetail.item,
  )
  quotationDetails!: QuotationDetailEntity[];
}
