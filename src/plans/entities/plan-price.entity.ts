import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
  Check,
} from 'typeorm';
import { PlanPeriod } from '../../database/database.enums';
import { Plan } from './plan.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity({ name: 'plan_prices' })
@Unique('uq_plan_price_period', ['planId', 'period'])
@Check('chk_plan_price_non_negative', '"price" >= 0')
export class PlanPrice {
  @PrimaryGeneratedColumn('uuid', { name: 'plan_price_id' })
  planPriceId!: string;

  @Column({ type: 'uuid', name: 'plan_id' })
  planId!: string;

  @ManyToOne(() => Plan, (plan) => plan.planPrices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id', referencedColumnName: 'planId' })
  plan!: Plan;

  @Column({
    type: 'enum',
    enum: PlanPeriod,
    enumName: 'plan_period_enum',
  })
  period!: PlanPeriod;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({
    type: 'numeric',
    name: 'price',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => Subscription, (subscription) => subscription.planPrice)
  subscriptions!: Subscription[];
}
