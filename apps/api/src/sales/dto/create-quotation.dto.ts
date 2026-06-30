import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryMethod } from '../../database/database.enums';

export class CreateQuotationDetailDto {
  @ApiProperty({
    description: 'ID del producto/servicio a cotizar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ description: 'Cantidad solicitada', example: 3 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    description: 'Precio unitario del producto/servicio',
    example: '99.99',
  })
  @Matches(/^\d+(\.\d{1,2})?$/)
  unitPrice!: string;

  @ApiPropertyOptional({
    description: 'Descuento aplicado al detalle',
    example: '10.00',
  })
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  discount?: string;
}

export class CreateQuotationDto {
  @ApiProperty({
    description: 'ID del cliente',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  customerId!: string;

  @ApiProperty({
    description: 'Lista de productos/servicios incluidos en la cotización',
    type: [CreateQuotationDetailDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationDetailDto)
  details!: CreateQuotationDetailDto[];

  @ApiPropertyOptional({
    description: 'Descripción o notas adicionales de la cotización',
    example: 'Cotización para evento corporativo',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Fecha de entrega estimada',
    example: '2026-12-31',
  })
  @IsString()
  deliveryDate!: string;

  @ApiProperty({
    description: 'Método de entrega',
    enum: DeliveryMethod,
    enumName: 'DeliveryMethod',
    example: 'DELIVERY',
  })
  @IsEnum(DeliveryMethod)
  deliveryMethod!: DeliveryMethod;
}
