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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemClass } from '../../database/database.enums';
import { ItemEntity } from './item.entity';

@Entity({ name: 'products' })
@Check('chk_product_item_class', `"item_class" = 'Producto'`)
@Check('chk_product_stock_non_negative', '"stock" >= 0')
export class ProductEntity {
  @ApiProperty({
    description: 'Identificador del ítem (FK a items)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryColumn({ type: 'uuid', name: 'item_id' })
  itemId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ApiProperty({
    description: 'Clase del ítem (siempre PRODUCTO)',
    example: 'PRODUCTO',
  })
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

  @ApiPropertyOptional({
    description: 'Stock disponible del producto',
    example: 50,
  })
  @Column({ type: 'integer', name: 'stock', default: 0 })
  stock!: number;

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
