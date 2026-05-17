import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PlanStatus } from '../../database/database.enums';
import { PlanPrice } from './plan-price.entity';

@Entity({ name: 'plans' })
export class Plan {
  @PrimaryGeneratedColumn('uuid', { name: 'plan_id' })
  planId!: string;

  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

  @Column({ type: 'varchar', name: 'description', length: 100 })
  description!: string;

  @Column({
    type: 'enum',
    enum: PlanStatus,
    enumName: 'plan_status_enum',
    default: PlanStatus.Enabled,
  })
  status!: PlanStatus;

  @OneToMany(() => PlanPrice, (planPrice) => planPrice.plan)
  planPrices!: PlanPrice[];
}
