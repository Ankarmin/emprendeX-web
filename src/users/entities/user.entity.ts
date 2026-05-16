import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true, length: 160 })
  email!: string;

  @Column({
    type: 'varchar',
    name: 'password_hash',
    select: false,
    length: 255,
  })
  passwordHash!: string;

  @Column({
    type: 'varchar',
    name: 'business_name',
    nullable: true,
    length: 120,
  })
  businessName!: string | null;

  @Column({
    type: 'varchar',
    name: 'business_category',
    nullable: true,
    length: 120,
  })
  businessCategory!: string | null;

  @Column({
    type: 'varchar',
    name: 'currency_code',
    nullable: true,
    length: 10,
  })
  currencyCode!: string | null;

  @Column({ name: 'onboarding_completed', default: false })
  onboardingCompleted!: boolean;

  @Column({
    type: 'text',
    name: 'enabled_module_ids',
    array: true,
    default: () => "'{}'",
  })
  enabledModuleIds!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  assignId() {
    this.id ??= randomUUID();
  }
}
