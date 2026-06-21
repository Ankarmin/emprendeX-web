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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Identificador único del ítem',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'item_id' })
  itemId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @ApiProperty({
    description: 'Clase del ítem (PRODUCTO o SERVICIO)',
    example: 'PRODUCTO',
  })
  @Column({
    type: 'enum',
    name: 'item_class',
    enum: ItemClass,
    enumName: 'item_class_enum',
  })
  itemClass!: ItemClass;

  @ApiProperty({
    description: 'Identificador de la categoría',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'category_id' })
  categoryId!: string;

  @ManyToOne(() => CategoryEntity, (category) => category.items)
  @JoinColumn([
    { name: 'category_id', referencedColumnName: 'categoryId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
    { name: 'item_class', referencedColumnName: 'itemClass' },
  ])
  category!: CategoryEntity;

  @ApiProperty({
    description: 'Identificador de la unidad de medida',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'unit_id' })
  unitId!: string;

  @ManyToOne(() => UnitEntity, (unit) => unit.items)
  @JoinColumn([
    { name: 'unit_id', referencedColumnName: 'unitId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
    { name: 'item_class', referencedColumnName: 'itemClass' },
  ])
  unit!: UnitEntity;

  @ApiProperty({
    description: 'Nombre del ítem',
    example: 'Producto Ejemplo',
  })
  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

  @ApiPropertyOptional({
    description: 'Descripción del ítem',
    example: 'Descripción detallada del producto',
  })
  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

  @ApiPropertyOptional({
    description: 'Código SKU del ítem',
    example: 'SKU-00123',
  })
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

  @ApiPropertyOptional({
    description: 'URL de la imagen del ítem',
    example: 'https://ejemplo.com/imagen.png',
  })
  @Column({ type: 'varchar', name: 'image_url', length: 2048, nullable: true })
  imageUrl!: string | null;

  @ApiProperty({
    description: 'Precio del ítem',
    example: 99.99,
  })
  @Column({
    type: 'numeric',
    name: 'price',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price!: string;

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
