import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ModuleType } from '../../database/database.enums';
import { BusinessModule } from '../../businesses/entities/business-module.entity';

@Entity({ name: 'modules' })
@Unique('uq_modules_name', ['moduleName'])
@Unique('uq_modules_code', ['code'])
export class FeatureModuleEntity {
  @ApiProperty({
    description: 'Identificador único del módulo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'module_id' })
  moduleId!: string;

  @ApiProperty({
    description: 'Nombre del módulo',
    example: 'Catálogo de Productos',
  })
  @Column({ type: 'varchar', name: 'module_name', length: 100 })
  moduleName!: string;

  @ApiProperty({
    description: 'Código único del módulo',
    example: 'CATALOG',
  })
  @Column({ type: 'varchar', name: 'code', length: 50, unique: true })
  code!: string;

  @ApiProperty({
    description: 'Tipo de módulo',
    example: 'CORE',
  })
  @Column({
    type: 'enum',
    name: 'module_type',
    enum: ModuleType,
    enumName: 'module_type_enum',
  })
  moduleType!: ModuleType;

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

  @OneToMany(() => BusinessModule, (businessModule) => businessModule.module)
  businessModules!: BusinessModule[];
}
