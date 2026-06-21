import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemClass } from '../../database/database.enums';
import {
  HTTPS_URL_REGEX,
  transformTrimmedNullableString,
} from '../../common/utils/url.util';

export class CreateItemDto {
  @ApiProperty({ description: 'Clase del ítem (Producto o Servicio)', enum: ItemClass, enumName: 'ItemClass', example: ItemClass.Product })
  @IsEnum(ItemClass)
  itemClass!: ItemClass;

  @ApiProperty({ description: 'Nombre del ítem', example: 'Café Americano' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Descripción del ítem', example: 'Café americano recién preparado con granos seleccionados' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Código SKU del producto', example: 'CAF-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ description: 'URL de la imagen del ítem', example: 'https://ejemplo.com/imagenes/cafe.jpg' })
  @IsOptional()
  @Transform(transformTrimmedNullableString)
  @Matches(HTTPS_URL_REGEX)
  @MaxLength(2048)
  imageUrl?: string | null;

  @ApiProperty({ description: 'Precio del ítem', example: '12.50' })
  @Matches(/^\d+(\.\d{1,2})?$/)
  price!: string;

  @ApiProperty({ description: 'ID de la unidad de medida', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  unitId!: string;

  @ApiProperty({ description: 'ID de la categoría', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ description: 'Cantidad en stock (solo para productos)', example: 50 })
  @ValidateIf((dto: CreateItemDto) => dto.itemClass === ItemClass.Product)
  @IsInt()
  @Min(0)
  stock?: number;
}
