import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, Matches, MaxLength } from 'class-validator';
import { transformTrimmedNullableString } from '../../common/utils/url.util';
import { ColorPaletteId } from '../../database/database.enums';
import { HTTPS_URL_REGEX } from '../../common/utils/url.util';

export class UpdateBusinessPreferencesDto {
  @IsOptional()
  @IsEnum(ColorPaletteId)
  colorPaletteId?: ColorPaletteId;

  @IsOptional()
  @Transform(transformTrimmedNullableString)
  @Matches(HTTPS_URL_REGEX)
  @MaxLength(2048)
  logoUrl?: string | null;
}
