import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { transformTrimmedString } from '../../common/utils/dni.util';

export class UpdateBusinessPublicCatalogDto {
  @ApiPropertyOptional({
    description: 'Slug del catálogo público',
    example: 'mi-catalogo-2026',
  })
  @IsOptional()
  @Transform(transformTrimmedString)
  @IsString()
  @MaxLength(120)
  publicCatalogSlug?: string;

  @ApiPropertyOptional({
    description: 'Indica si el catálogo es visible al público',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  catalogIsPublic?: boolean;
}
