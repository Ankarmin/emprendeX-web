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
import {
  HTTPS_URL_REGEX,
  transformTrimmedNullableString,
} from '../../common/utils/url.util';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
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

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  price?: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
