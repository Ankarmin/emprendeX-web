import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUnitDto {
  @ApiPropertyOptional({
    description: 'Nombre de la unidad de medida',
    example: 'Kilogramo',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  unitName?: string;
}
