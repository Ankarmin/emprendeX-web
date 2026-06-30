import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({
    description: 'ID de la categoría financiera',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  financialCategoryId!: string;

  @ApiProperty({
    description: 'ID del método de pago utilizado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  paymentMethodId!: string;

  @ApiProperty({ description: 'Monto del gasto', example: '150.00' })
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;

  @ApiPropertyOptional({
    description: 'Descripción del gasto',
    example: 'Compra de materiales de oficina',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
