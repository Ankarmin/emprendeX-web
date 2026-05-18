import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { ProductEntity } from './product.entity';

@Entity({ name: 'units' })
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

  @Column({ type: 'varchar', name: 'unit_name', length: 100 })
  unitName!: string;

  @Column({ type: 'varchar', name: 'abbreviation', length: 10 })
  abbreviation!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => ProductEntity, (product) => product.unit)
  products!: ProductEntity[];
}
