import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PlanPeriod } from '../../database/database.enums';
import { Plan } from './plan.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity({ name: 'plan_prices' })
@Index('uq_active_plan_price_period', ['planId', 'period'], {
  unique: true,
  where: 'is_active = TRUE',
})
@Check('chk_plan_price_non_negative', '"price" >= 0')
export class PlanPrice {
  @ApiProperty({
    description: 'Identificador único del precio del plan',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'plan_price_id' })
  planPriceId!: string;

  @ApiProperty({
    description: 'Identificador del plan',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'plan_id' })
  planId!: string;

  @ManyToOne(() => Plan, (plan) => plan.planPrices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id', referencedColumnName: 'planId' })
  plan!: Plan;

  @ApiProperty({
    description: 'Periodo del plan',
    example: 'MONTHLY',
  })
  @Column({
    type: 'enum',
    enum: PlanPeriod,
    enumName: 'plan_period_enum',
  })
  period!: PlanPeriod;

  @ApiProperty({
    description: 'Indica si el precio está activo',
    example: true,
  })
  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @ApiProperty({
    description: 'Precio del plan',
    example: 29.99,
  })
  @Column({
    type: 'numeric',
    name: 'price',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price!: string;

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

  @OneToMany(() => Subscription, (subscription) => subscription.planPrice)
  subscriptions!: Subscription[];
}
