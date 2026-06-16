import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { BusinessModuleStatus } from '../../database/database.enums';
import { Business } from './business.entity';
import { FeatureModuleEntity } from '../../modules/entities/feature-module.entity';

@Entity({ name: 'business_modules' })
@Unique('uq_business_module', ['businessId', 'moduleId'])
export class BusinessModule {
  @PrimaryGeneratedColumn('uuid', { name: 'business_module_id' })
  businessModuleId!: string;

  @Column('uuid', { name: 'business_id' })
  businessId!: string;

  @Column('uuid', { name: 'module_id' })
  moduleId!: string;

  @ManyToOne(() => Business, (business) => business.businessModules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @ManyToOne(
    () => FeatureModuleEntity,
    (featureModule) => featureModule.businessModules,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'module_id', referencedColumnName: 'moduleId' })
  module!: FeatureModuleEntity;

  @Column({
    type: 'enum',
    enum: BusinessModuleStatus,
    enumName: 'business_module_status_enum',
    default: BusinessModuleStatus.Blocked,
  })
  status!: BusinessModuleStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
