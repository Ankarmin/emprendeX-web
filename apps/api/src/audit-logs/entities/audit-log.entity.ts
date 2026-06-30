import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Business } from '../../businesses/entities/business.entity';
import { AuditAction } from '../../database/database.enums';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLogEntity {
  @ApiProperty({
    description: 'Identificador único del registro de auditoría',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'audit_log_id' })
  auditLogId!: string;

  @ApiPropertyOptional({
    description: 'Identificador del usuario que realizó la acción',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'actor_user_id', nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => User, (user) => user.auditLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'actor_user_id', referencedColumnName: 'userId' })
  actorUser!: User | null;

  @ApiPropertyOptional({
    description: 'Identificador del negocio asociado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id', nullable: true })
  businessId!: string | null;

  @ManyToOne(() => Business, (business) => business.auditLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business | null;

  @ApiProperty({
    description: 'Acción realizada',
    example: 'CREATE',
  })
  @Column({
    type: 'enum',
    name: 'action',
    enum: AuditAction,
    enumName: 'audit_action_enum',
  })
  action!: AuditAction;

  @ApiPropertyOptional({
    description: 'Nombre de la tabla afectada',
    example: 'items',
  })
  @Column({ type: 'varchar', name: 'table_name', length: 100, nullable: true })
  tableName!: string | null;

  @ApiPropertyOptional({
    description: 'Identificador del registro afectado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'record_id', nullable: true })
  recordId!: string | null;

  @ApiPropertyOptional({
    description: 'Datos anteriores al cambio',
    example: { name: 'Antiguo' },
  })
  @Column({ type: 'jsonb', name: 'old_data', nullable: true })
  oldData!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Datos nuevos después del cambio',
    example: { name: 'Nuevo' },
  })
  @Column({ type: 'jsonb', name: 'new_data', nullable: true })
  newData!: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Dirección IP del usuario',
    example: '192.168.1.1',
  })
  @Column({ type: 'inet', name: 'ip_address', nullable: true })
  ipAddress!: string | null;

  @ApiPropertyOptional({
    description: 'User-Agent del navegador',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  })
  @Column({ type: 'text', name: 'user_agent', nullable: true })
  userAgent!: string | null;

  @ApiProperty({
    description: 'Fecha de creación del registro',
    example: '2026-06-21T12:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
