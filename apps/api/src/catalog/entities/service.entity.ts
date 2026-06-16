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

@Entity({ name: 'services' })
@Check('chk_service_item_class', `"item_class" = 'Servicio'`)
export class ServiceEntity {
  @PrimaryColumn({ type: 'uuid', name: 'item_id' })
  itemId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @Column({
    type: 'enum',
    name: 'item_class',
    enum: ItemClass,
    enumName: 'item_class_enum',
    default: ItemClass.Service,
  })
  itemClass!: ItemClass;

  @OneToOne(() => ItemEntity, (item) => item.service, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'item_id', referencedColumnName: 'itemId' },
    { name: 'business_id', referencedColumnName: 'businessId' },
    { name: 'item_class', referencedColumnName: 'itemClass' },
  ])
  item!: ItemEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
