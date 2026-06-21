import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ColorPaletteId } from '../../database/database.enums';
import { Business } from './business.entity';

@Entity({ name: 'business_preferences' })
@Unique('uq_business_preferences_business', ['businessId'])
@Check(
  'chk_business_preferences_logo_url_https',
  `logo_url IS NULL OR logo_url ~* '^https://[^[:space:]<>''"]+$'`,
)
export class BusinessPreferencesEntity {
  @ApiProperty({
    description: 'Identificador único de la preferencia',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'business_preference_id' })
  businessPreferenceId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @OneToOne(() => Business, (business) => business.preferences, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @ApiProperty({
    description: 'Identificador de la paleta de colores',
    example: 'violet',
  })
  @Column({
    type: 'enum',
    name: 'color_palette_id',
    enum: ColorPaletteId,
    enumName: 'color_palette_id_enum',
    default: ColorPaletteId.Violet,
  })
  colorPaletteId!: ColorPaletteId;

  @ApiPropertyOptional({
    description: 'URL del logo del negocio',
    example: 'https://ejemplo.com/logo.png',
  })
  @Column({ type: 'varchar', name: 'logo_url', length: 2048, nullable: true })
  logoUrl!: string | null;

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
