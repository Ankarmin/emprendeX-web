import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemClass } from '../../database/database.enums';

export class CreateUnitDto {
  @ApiProperty({ description: 'Clase de ítem al que pertenece la unidad', enum: ItemClass, enumName: 'ItemClass', example: ItemClass.Product })
  @IsEnum(ItemClass)
  itemClass!: ItemClass;

  @ApiProperty({ description: 'Nombre de la unidad de medida', example: 'Kilogramo' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  unitName!: string;
}
