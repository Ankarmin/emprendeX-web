import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { PlanStatus } from '../../database/database.enums';
import { PlanPrice } from './plan-price.entity';

@Entity({ name: 'plans' })
@Unique('uq_plans_name', ['name'])
export class Plan {
  @PrimaryGeneratedColumn('uuid', { name: 'plan_id' })
  planId!: string;

  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

  @Column({ type: 'varchar', name: 'description', length: 150 })
  description!: string;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    enumName: 'plan_status_enum',
    default: PlanStatus.Enabled,
  })
  status!: PlanStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => PlanPrice, (planPrice) => planPrice.plan)
  planPrices!: PlanPrice[];
}
