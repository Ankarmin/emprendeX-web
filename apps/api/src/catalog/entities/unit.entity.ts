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
import { ApiProperty } from '@nestjs/swagger';
import { Business } from '../../businesses/entities/business.entity';
import { ItemClass } from '../../database/database.enums';
import { ItemEntity } from './item.entity';

@Entity({ name: 'units' })
@Unique('uq_units_business_class_name', ['businessId', 'itemClass', 'unitName'])
@Unique('uq_units_id_business_class', ['unitId', 'businessId', 'itemClass'])
export class UnitEntity {
  @ApiProperty({
    description: 'Identificador único de la unidad de medida',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'unit_id' })
  unitId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.units, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @ApiProperty({
    description: 'Clase de ítem (PRODUCTO o SERVICIO)',
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
    description: 'Nombre de la unidad de medida',
    example: 'Unidad',
  })
  @Column({ type: 'varchar', name: 'unit_name', length: 100 })
  unitName!: string;

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

  @OneToMany(() => ItemEntity, (item) => item.unit)
  items!: ItemEntity[];
}
