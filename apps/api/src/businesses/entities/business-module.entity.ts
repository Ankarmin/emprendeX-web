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
import { ApiProperty } from '@nestjs/swagger';
import { BusinessModuleStatus } from '../../database/database.enums';
import { Business } from './business.entity';
import { FeatureModuleEntity } from '../../modules/entities/feature-module.entity';

@Entity({ name: 'business_modules' })
@Unique('uq_business_module', ['businessId', 'moduleId'])
export class BusinessModule {
  @ApiProperty({
    description: 'Identificador único del módulo de negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'business_module_id' })
  businessModuleId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column('uuid', { name: 'business_id' })
  businessId!: string;

  @ApiProperty({
    description: 'Identificador del módulo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
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

  @ApiProperty({
    description: 'Estado del módulo para el negocio',
    example: 'active',
  })
  @Column({
    type: 'enum',
    enum: BusinessModuleStatus,
    enumName: 'business_module_status_enum',
    default: BusinessModuleStatus.Blocked,
  })
  status!: BusinessModuleStatus;

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
