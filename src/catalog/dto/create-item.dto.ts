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
import { ItemClass } from '../../database/database.enums';

export class CreateItemDto {
  @IsEnum(ItemClass)
  itemClass!: ItemClass;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @Matches(/^\d+(\.\d{1,2})?$/)
  price!: string;

  @ValidateIf((dto: CreateItemDto) => dto.itemClass === ItemClass.Product)
  @IsUUID()
  unitId?: string;

  @ValidateIf(
    (dto: CreateItemDto) =>
      dto.itemClass === ItemClass.Product && dto.unitId === undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  unitName?: string;

  @ValidateIf((dto: CreateItemDto) => dto.itemClass === ItemClass.Product)
  @IsInt()
  @Min(0)
  stock?: number;

  @ValidateIf((dto: CreateItemDto) => dto.itemClass === ItemClass.Service)
  @IsUUID()
  categoryId?: string;

  @ValidateIf(
    (dto: CreateItemDto) =>
      dto.itemClass === ItemClass.Service && dto.categoryId === undefined,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  categoryName?: string;
}
