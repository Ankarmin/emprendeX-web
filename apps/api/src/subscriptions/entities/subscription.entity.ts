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
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    description: 'Identificador único de la suscripción',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'subscription_id' })
  subscriptionId!: string;

  @ApiProperty({
    description: 'Identificador del precio del plan',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'plan_price_id' })
  planPriceId!: string;

  @ApiProperty({
    description: 'Identificador del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => PlanPrice, (planPrice) => planPrice.subscriptions)
  @JoinColumn({ name: 'plan_price_id', referencedColumnName: 'planPriceId' })
  planPrice!: PlanPrice;

  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  user!: User;

  @ApiProperty({
    description: 'Fecha de inicio de la suscripción',
    example: '2026-06-21T12:00:00.000Z',
  })
  @Column({
    type: 'timestamptz',
    name: 'start_date',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startDate!: Date;

  @ApiProperty({
    description: 'Fecha de fin de la suscripción',
    example: '2026-07-21T12:00:00.000Z',
  })
  @Column({ type: 'timestamptz', name: 'end_date' })
  endDate!: Date;

  @ApiProperty({
    description: 'Estado de la suscripción',
    example: 'active',
  })
  @Column({
    type: 'enum',
    name: 'status',
    enum: SubscriptionStatus,
    enumName: 'subscription_status_enum',
    default: SubscriptionStatus.Active,
  })
  status!: SubscriptionStatus;

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
