import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Business } from '../../businesses/entities/business.entity';
import { AuditAction } from '../../database/database.enums';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'audit_log_id' })
  auditLogId!: string;

  @Column({ type: 'uuid', name: 'actor_user_id', nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => User, (user) => user.auditLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'actor_user_id', referencedColumnName: 'userId' })
  actorUser!: User | null;

  @Column({ type: 'uuid', name: 'business_id', nullable: true })
  businessId!: string | null;

  @ManyToOne(() => Business, (business) => business.auditLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business | null;

  @Column({
    type: 'enum',
    name: 'action',
    enum: AuditAction,
    enumName: 'audit_action_enum',
  })
  action!: AuditAction;

  @Column({ type: 'varchar', name: 'table_name', length: 100, nullable: true })
  tableName!: string | null;

  @Column({ type: 'uuid', name: 'record_id', nullable: true })
  recordId!: string | null;

  @Column({ type: 'jsonb', name: 'old_data', nullable: true })
  oldData!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', name: 'new_data', nullable: true })
  newData!: Record<string, unknown> | null;

  @Column({ type: 'inet', name: 'ip_address', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
