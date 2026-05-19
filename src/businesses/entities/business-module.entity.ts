import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BusinessModuleStatus } from '../../database/database.enums';
import { Business } from './business.entity';
import { FeatureModuleEntity } from '../../modules/entities/feature-module.entity';

@Entity({ name: 'business_modules' })
export class BusinessModule {
  @PrimaryColumn('uuid', { name: 'business_id' })
  businessId!: string;

  @PrimaryColumn('uuid', { name: 'module_id' })
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
    default: BusinessModuleStatus.Enabled,
  })
  status!: BusinessModuleStatus;
}
