import { IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID de la orden a pagar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  orderId!: string;

  @ApiProperty({
    description: 'ID del método de pago',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  paymentMethodId!: string;

  @ApiProperty({ description: 'Monto del pago', example: '250.00' })
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;
}
