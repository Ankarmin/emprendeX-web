import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { transformTrimmedNullableString } from '../../common/utils/url.util';
import { ColorPaletteId } from '../../database/database.enums';
import { HTTPS_URL_REGEX } from '../../common/utils/url.util';

export class UpdateBusinessPreferencesDto {
  @ApiPropertyOptional({ description: 'ID de la paleta de colores del negocio', enum: ColorPaletteId, enumName: 'ColorPaletteId', example: 'PALETTE_1' })
  @IsOptional()
  @IsEnum(ColorPaletteId)
  colorPaletteId?: ColorPaletteId;

  @ApiPropertyOptional({ description: 'URL del logo del negocio', example: 'https://ejemplo.com/logo.png' })
  @IsOptional()
  @Transform(transformTrimmedNullableString)
  @Matches(HTTPS_URL_REGEX)
  @MaxLength(2048)
  logoUrl?: string | null;
}
