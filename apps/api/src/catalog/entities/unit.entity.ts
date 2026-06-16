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

@Entity({ name: 'units' })
@Unique('uq_units_business_class_name', ['businessId', 'itemClass', 'unitName'])
@Unique('uq_units_id_business_class', ['unitId', 'businessId', 'itemClass'])
export class UnitEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'unit_id' })
  unitId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.units, {
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

  @Column({ type: 'varchar', name: 'unit_name', length: 100 })
  unitName!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => ItemEntity, (item) => item.unit)
  items!: ItemEntity[];
}
