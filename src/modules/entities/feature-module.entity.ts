import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ModuleType } from '../../database/database.enums';
import { BusinessModule } from '../../businesses/entities/business-module.entity';

@Entity({ name: 'modules' })
export class FeatureModuleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'module_id' })
  moduleId!: string;

  @Column({ type: 'varchar', name: 'module_name', length: 100 })
  moduleName!: string;

  @Column({
    type: 'enum',
    name: 'module_type',
    enum: ModuleType,
    enumName: 'module_type_enum',
  })
  moduleType!: ModuleType;

  @OneToMany(() => BusinessModule, (businessModule) => businessModule.module)
  businessModules!: BusinessModule[];
}
