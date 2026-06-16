import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { ItemClass } from '../../database/database.enums';

export class CreateCategoryDto {
  @IsEnum(ItemClass)
  itemClass!: ItemClass;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  categoryName!: string;
}
