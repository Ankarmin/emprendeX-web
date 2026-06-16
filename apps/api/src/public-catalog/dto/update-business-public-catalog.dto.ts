import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { transformTrimmedString } from '../../common/utils/dni.util';

export class UpdateBusinessPublicCatalogDto {
  @IsOptional()
  @Transform(transformTrimmedString)
  @IsString()
  @MaxLength(120)
  publicCatalogSlug?: string;

  @IsOptional()
  @IsBoolean()
  catalogIsPublic?: boolean;
}
