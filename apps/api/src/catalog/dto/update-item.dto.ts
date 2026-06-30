import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  HTTPS_URL_REGEX,
  transformTrimmedNullableString,
} from '../../common/utils/url.util';

export class UpdateItemDto {
  @ApiPropertyOptional({
    description: 'Nombre del ítem',
    example: 'Café Americano',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción del ítem',
    example: 'Café americano recién preparado con granos seleccionados',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Código SKU del producto',
    example: 'CAF-001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen del ítem',
    example: 'https://ejemplo.com/imagenes/cafe.jpg',
  })
  @IsOptional()
  @Transform(transformTrimmedNullableString)
  @Matches(HTTPS_URL_REGEX)
  @MaxLength(2048)
  imageUrl?: string | null;

  @ApiPropertyOptional({ description: 'Precio del ítem', example: '12.50' })
  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  price?: string;

  @ApiPropertyOptional({
    description: 'ID de la unidad de medida',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ description: 'Cantidad en stock', example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    description: 'ID de la categoría',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
