import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePaymentMethodDto {
  @ApiPropertyOptional({ description: 'Nuevo nombre del método de pago', example: 'Tarjeta de crédito' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
}
