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
import { ColorPaletteId } from '../../database/database.enums';
import { Business } from './business.entity';

@Entity({ name: 'business_preferences' })
@Unique('uq_business_preferences_business', ['businessId'])
@Check(
  'chk_business_preferences_logo_url_https',
  `logo_url IS NULL OR logo_url ~* '^https://[^[:space:]<>''"]+$'`,
)
export class BusinessPreferencesEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'business_preference_id' })
  businessPreferenceId!: string;

  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @OneToOne(() => Business, (business) => business.preferences, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @Column({
    type: 'enum',
    name: 'color_palette_id',
    enum: ColorPaletteId,
    enumName: 'color_palette_id_enum',
    default: ColorPaletteId.Violet,
  })
  colorPaletteId!: ColorPaletteId;

  @Column({ type: 'varchar', name: 'logo_url', length: 2048, nullable: true })
  logoUrl!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
