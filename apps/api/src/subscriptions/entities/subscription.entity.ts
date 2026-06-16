import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
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
@Index('uq_active_subscription_user', ['userId'], {
  unique: true,
  where: `status = 'Activo'`,
})
@Check('chk_subscription_dates', '"end_date" > "start_date"')
export class Subscription {
  @PrimaryGeneratedColumn('uuid', { name: 'subscription_id' })
  subscriptionId!: string;

  @Column({ type: 'uuid', name: 'plan_price_id' })
  planPriceId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => PlanPrice, (planPrice) => planPrice.subscriptions)
  @JoinColumn({ name: 'plan_price_id', referencedColumnName: 'planPriceId' })
  planPrice!: PlanPrice;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user!: User;

  @Column({
    type: 'timestamptz',
    name: 'start_date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startDate!: Date;

  @Column({ type: 'timestamptz', name: 'end_date' })
  endDate!: Date;

  @Column({
    type: 'enum',
    name: 'status',
    enum: SubscriptionStatus,
    enumName: 'subscription_status_enum',
    default: SubscriptionStatus.Active,
  })
  status!: SubscriptionStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
