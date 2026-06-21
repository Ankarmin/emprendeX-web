import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryMethod } from '../../database/database.enums';
import {
  DNI_REGEX,
  DNI_VALIDATION_MESSAGE,
  transformTrimmedString,
} from '../../common/utils/dni.util';
import {
  MAX_PUBLIC_ITEM_QUANTITY,
  MAX_PUBLIC_QUOTATION_ITEMS,
} from '../public-catalog.config';

class SubmitPublicQuotationCustomerDto {
  @ApiProperty({ description: 'Modo de registro del cliente', enum: ['new', 'existing'], enumName: 'CustomerMode', example: 'new' })
  @IsIn(['new', 'existing'])
  mode!: 'new' | 'existing';

  @ApiProperty({ description: 'Documento Nacional de Identidad (DNI)', example: '12345678' })
  @Transform(transformTrimmedString)
  @IsString()
  @Matches(DNI_REGEX, { message: DNI_VALIDATION_MESSAGE })
  dni!: string;

  @ApiPropertyOptional({ description: 'Nombres del cliente', example: 'María Elena' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstNames?: string;

  @ApiPropertyOptional({ description: 'Apellidos del cliente', example: 'Pérez Rojas' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastNames?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico del cliente', example: 'cliente@ejemplo.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '999888777' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{6,20}$/)
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Dirección del cliente', example: 'Jr. Comercio 456, Arequipa' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;
}

class SubmitPublicQuotationItemDto {
  @ApiProperty({ description: 'ID del producto/servicio a cotizar', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  itemId!: string;

  @ApiProperty({ description: 'Cantidad solicitada', example: 5 })
  @IsInt()
  @Min(1)
  @Max(MAX_PUBLIC_ITEM_QUANTITY)
  quantity!: number;
}

export class SubmitPublicQuotationDto {
  @ApiProperty({ description: 'Datos del cliente que realiza la cotización', type: () => SubmitPublicQuotationCustomerDto })
  @ValidateNested()
  @Type(() => SubmitPublicQuotationCustomerDto)
  customer!: SubmitPublicQuotationCustomerDto;

  @ApiProperty({ description: 'Lista de productos/servicios solicitados', type: [SubmitPublicQuotationItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PUBLIC_QUOTATION_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => SubmitPublicQuotationItemDto)
  items!: SubmitPublicQuotationItemDto[];

  @ApiPropertyOptional({ description: 'Descripción o notas adicionales de la cotización', example: 'Cotización para evento escolar' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Fecha de entrega deseada', example: '2026-12-31' })
  @IsDateString()
  deliveryDate!: string;

  @ApiProperty({ description: 'Método de entrega', enum: DeliveryMethod, enumName: 'DeliveryMethod', example: 'PICKUP' })
  @IsEnum(DeliveryMethod)
  deliveryMethod!: DeliveryMethod;

  @ApiPropertyOptional({ description: 'Token de verificación Turnstile (Cloudflare)', example: '1x00000000000000000000AA' })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
