import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanPrice } from '../../plans/entities/plan-price.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid', { name: 'subscription_id' })
  subscriptionId!: string;

  @Column({ type: 'uuid', name: 'plan_price_id' })
  planPriceId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => PlanPrice, (planPrice) => planPrice.subscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_price_id', referencedColumnName: 'planPriceId' })
  planPrice!: PlanPrice;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user!: User;

  @CreateDateColumn({ name: 'start_date', type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp', name: 'end_date' })
  endDate!: Date;

  @Column({ type: 'boolean', name: 'status', default: true })
  status!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
