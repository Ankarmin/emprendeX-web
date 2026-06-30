import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Nombre del método de pago',
    example: 'Transferencia bancaria',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}
