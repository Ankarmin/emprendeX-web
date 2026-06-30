import {
  Check,
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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Business } from '../../businesses/entities/business.entity';
import { FinancialCategoryEntity } from '../../financial-categories/entities/financial-category.entity';
import { ExpenseDetailEntity } from './expense-detail.entity';

@Entity({ name: 'expenses' })
@Unique('uq_expenses_business_reference_code', ['businessId', 'referenceCode'])
@Unique('uq_expenses_id_business', ['expenseId', 'businessId'])
@Check('chk_expense_total_positive', '"total" > 0')
export class ExpenseEntity {
  @ApiProperty({
    description: 'Identificador único del gasto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid', { name: 'expense_id' })
  expenseId!: string;

  @ApiProperty({
    description: 'Identificador del negocio',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'business_id' })
  businessId!: string;

  @ManyToOne(() => Business, (business) => business.expenses)
  @JoinColumn({ name: 'business_id', referencedColumnName: 'businessId' })
  business!: Business;

  @ApiProperty({
    description: 'Identificador de la categoría financiera',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({ type: 'uuid', name: 'financial_category_id' })
  financialCategoryId!: string;

  @ManyToOne(
    () => FinancialCategoryEntity,
    (financialCategory) => financialCategory.expenses,
  )
  @JoinColumn([
    {
      name: 'financial_category_id',
      referencedColumnName: 'financialCategoryId',
    },
    { name: 'business_id', referencedColumnName: 'businessId' },
  ])
  financialCategory!: FinancialCategoryEntity;

  @ApiPropertyOptional({
    description: 'Descripción del gasto',
    example: 'Compra de materiales de oficina',
  })
  @Column({ type: 'text', name: 'description', nullable: true })
  description!: string | null;

  @ApiProperty({
    description: 'Total del gasto',
    example: 250.00,
  })
  @Column({ type: 'numeric', name: 'total', precision: 10, scale: 2 })
  total!: string;

  @Column({
    type: 'varchar',
    name: 'reference_code',
    length: 100,
    insert: false,
    update: false,
  })
  referenceCode!: string;

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

  @OneToMany(
    () => ExpenseDetailEntity,
    (expenseDetail) => expenseDetail.expense,
  )
  expenseDetails!: ExpenseDetailEntity[];
}
