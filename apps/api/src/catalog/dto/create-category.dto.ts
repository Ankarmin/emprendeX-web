import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemClass } from '../../database/database.enums';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Clase de ítem al que pertenece la categoría', enum: ItemClass, enumName: 'ItemClass', example: ItemClass.Product })
  @IsEnum(ItemClass)
  itemClass!: ItemClass;

  @ApiProperty({ description: 'Nombre de la categoría', example: 'Bebidas' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  categoryName!: string;
}
