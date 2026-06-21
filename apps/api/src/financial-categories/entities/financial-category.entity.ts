import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Business } from '../../businesses/entities/business.entity';
import { ExpenseEntity } from '../../expenses/entities/expense.entity';

@Entity({ name: 'financial_categories' })
@Unique('uq_financial_categories_business_name', ['businessId', 'name'])
@Unique('uq_financial_categories_id_business', [
  'financialCategoryId',
  'businessId',
])
export class FinancialCategoryEntity {
  @ApiProperty({
    description: 'Identificador único de la categoría financiera',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'financial_category_id' })
  financialCategoryId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.financialCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @ApiProperty({
    description: 'Nombre de la categoría financiera',
    example: 'Servicios básicos',
  })
  @Column({ type: 'varchar', name: 'name', length: 100 })
  name!: string;

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

  @OneToMany(() => ExpenseEntity, (expense) => expense.financialCategory)
  expenses!: ExpenseEntity[];
}
