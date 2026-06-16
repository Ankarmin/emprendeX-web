import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ModuleType } from '../../database/database.enums';
import { BusinessModule } from '../../businesses/entities/business-module.entity';

@Entity({ name: 'modules' })
@Unique('uq_modules_name', ['moduleName'])
@Unique('uq_modules_code', ['code'])
export class FeatureModuleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'module_id' })
  moduleId!: string;

  @Column({ type: 'varchar', name: 'module_name', length: 100 })
  moduleName!: string;

  @Column({ type: 'varchar', name: 'code', length: 50, unique: true })
  code!: string;

  @Column({
    type: 'enum',
    name: 'module_type',
    enum: ModuleType,
    enumName: 'module_type_enum',
  })
  moduleType!: ModuleType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => BusinessModule, (businessModule) => businessModule.module)
  businessModules!: BusinessModule[];
}
