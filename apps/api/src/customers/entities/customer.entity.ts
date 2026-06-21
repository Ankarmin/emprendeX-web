import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Business } from '../../businesses/entities/business.entity';
import { trimmedStringTransformer } from '../../common/utils/dni.util';
import { QuotationEntity } from '../../quotations/entities/quotation.entity';

@Entity({ name: 'customers' })
@Unique('uq_customers_id_business', ['customerId', 'businessId'])
@Index('uq_customers_business_email', ['businessId', 'email'], {
  unique: true,
  where: 'email IS NOT NULL',
})
@Index('uq_customers_business_phone', ['businessId', 'phone'], {
  unique: true,
  where: 'phone IS NOT NULL',
})
@Index('uq_customers_business_dni', ['businessId', 'dni'], {
  unique: true,
})
export class Customer {
  @ApiProperty({
    description: 'Identificador único del cliente',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'customer_id' })
  customerId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.customers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @ApiProperty({
    description: 'Nombres del cliente',
    example: 'María José',
  })
  @Column({ type: 'varchar', name: 'first_names', length: 100 })
  firstNames!: string;

  @ApiPropertyOptional({
    description: 'Apellidos del cliente',
    example: 'García Fernández',
  })
  @Column({ type: 'varchar', name: 'last_names', length: 100, nullable: true })
  lastNames!: string | null;

  @ApiProperty({
    description: 'DNI del cliente (8 dígitos)',
    example: '87654321',
  })
  @Column({
    type: 'char',
    name: 'dni',
    length: 8,
    transformer: trimmedStringTransformer,
  })
  dni!: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico del cliente',
    example: 'cliente@ejemplo.com',
  })
  @Column({ type: 'citext', name: 'email', nullable: true })
  email!: string | null;

  @ApiPropertyOptional({
    description: 'Teléfono del cliente',
    example: '999111222',
  })
  @Column({ type: 'varchar', name: 'phone', length: 20, nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({
    description: 'Dirección del cliente',
    example: 'Av. Principal 123, Lima',
  })
  @Column({ type: 'text', name: 'address', nullable: true })
  address!: string | null;

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

  @OneToMany(() => QuotationEntity, (quotation) => quotation.customer)
  quotations!: QuotationEntity[];
}
