import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AuditLogEntity } from '../../audit-logs/entities/audit-log.entity';
import { Business } from '../../businesses/entities/business.entity';
import { trimmedStringTransformer } from '../../common/utils/dni.util';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity({ name: 'users' })
export class User {
  @ApiProperty({
    description: 'Identificador único del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId!: string;

  @ApiProperty({
    description: 'Nombres del usuario',
    example: 'Juan Carlos',
  })
  @Column({ type: 'varchar', name: 'first_names', length: 100 })
  firstNames!: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Pérez López',
  })
  @Column({ type: 'varchar', name: 'last_names', length: 100 })
  lastNames!: string;

  @ApiProperty({
    description: 'DNI del usuario (8 dígitos)',
    example: '12345678',
  })
  @Column({
    type: 'char',
    name: 'dni',
    length: 8,
    unique: true,
    transformer: trimmedStringTransformer,
  })
  dni!: string;

  @ApiProperty({
    description: 'Hash de la contraseña (no se retorna en consultas)',
    writeOnly: true,
  })
  @Column({
    type: 'varchar',
    name: 'password_hash',
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@ejemplo.com',
  })
  @Column({ type: 'citext', name: 'email', unique: true })
  email!: string;

  @ApiProperty({
    description: 'Teléfono del usuario',
    example: '999888777',
  })
  @Column({ type: 'varchar', name: 'phone', length: 20, unique: true })
  phone!: string;

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

  @OneToMany(() => Business, (business) => business.user)
  businesses!: Business[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions!: Subscription[];

  @OneToMany(() => AuditLogEntity, (auditLog) => auditLog.actorUser)
  auditLogs!: AuditLogEntity[];
}
