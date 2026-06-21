import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PlanStatus } from '../../database/database.enums';
import { PlanPrice } from './plan-price.entity';

@Entity({ name: 'plans' })
@Unique('uq_plans_name', ['name'])
export class Plan {
  @ApiProperty({
    description: 'Identificador único del plan',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'plan_id' })
  planId!: string;

  @ApiProperty({
    description: 'Nombre del plan',
    example: 'Plan Emprendedor',
  })
  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

  @ApiProperty({
    description: 'Descripción del plan',
    example: 'Plan básico para emprendedores',
  })
  @Column({ type: 'varchar', name: 'description', length: 150 })
  description!: string;

  @ApiProperty({
    description: 'Estado del plan',
    example: 'active',
  })
  @Column({
    type: 'enum',
    enum: PlanStatus,
    enumName: 'plan_status_enum',
    default: PlanStatus.Enabled,
  })
  status!: PlanStatus;

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

  @OneToMany(() => PlanPrice, (planPrice) => planPrice.plan)
  planPrices!: PlanPrice[];
}
