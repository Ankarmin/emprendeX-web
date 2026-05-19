import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';
import { SubscriptionStatus } from '../../database/database.enums';
import { PlanPrice } from '../../plans/entities/plan-price.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'subscriptions' })
@Check('chk_subscription_dates', '"end_date" > "start_date"')
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

  @Column({ type: 'timestamp', name: 'start_date' })
  startDate!: Date;

  @Column({ type: 'timestamp', name: 'end_date' })
  endDate!: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    enumName: 'subscription_status_enum',
  })
  status!: SubscriptionStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
