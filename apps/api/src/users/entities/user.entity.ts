import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuditLogEntity } from '../../audit-logs/entities/audit-log.entity';
import { Business } from '../../businesses/entities/business.entity';
import { trimmedStringTransformer } from '../../common/utils/dni.util';
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
    type: 'char',
    name: 'dni',
    length: 8,
    unique: true,
    transformer: trimmedStringTransformer,
  })
  dni!: string;

  @Column({
    type: 'varchar',
    name: 'password_hash',
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({ type: 'citext', name: 'email', unique: true })
  email!: string;

  @Column({ type: 'varchar', name: 'phone', length: 20, unique: true })
  phone!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Business, (business) => business.user)
  businesses!: Business[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions!: Subscription[];

  @OneToMany(() => AuditLogEntity, (auditLog) => auditLog.actorUser)
  auditLogs!: AuditLogEntity[];
}
