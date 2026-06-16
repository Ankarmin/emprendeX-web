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
import { ItemClass } from '../../database/database.enums';
import {
  HTTPS_URL_REGEX,
  transformTrimmedNullableString,
} from '../../common/utils/url.util';

export class CreateItemDto {
  @IsEnum(ItemClass)
  itemClass!: ItemClass;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @IsOptional()
  @Transform(transformTrimmedNullableString)
  @Matches(HTTPS_URL_REGEX)
  @MaxLength(2048)
  imageUrl?: string | null;

  @Matches(/^\d+(\.\d{1,2})?$/)
  price!: string;

  @IsUUID()
  unitId!: string;

  @IsUUID()
  categoryId!: string;

  @ValidateIf((dto: CreateItemDto) => dto.itemClass === ItemClass.Product)
  @IsInt()
  @Min(0)
  stock?: number;
}
