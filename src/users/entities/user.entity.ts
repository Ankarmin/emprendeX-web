import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserStatus } from '../../database/database.enums';
import { Business } from '../../businesses/entities/business.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', name: 'first_names', length: 100 })
  firstNames!: string;

  @Column({ type: 'varchar', name: 'last_names', length: 100 })
  lastNames!: string;

  @Column({
    type: 'varchar',
    name: 'password',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordHash!: string | null;

  @Column({ type: 'varchar', name: 'email', unique: true, length: 150 })
  email!: string;

  @Column({ type: 'varchar', name: 'phone', length: 20 })
  phone!: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    enumName: 'user_status_enum',
    default: UserStatus.Active,
  })
  status!: UserStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => Business, (business) => business.user)
  businesses!: Business[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions!: Subscription[];
}
