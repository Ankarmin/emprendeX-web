import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Nombre de la categoría', example: 'Bebidas' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  categoryName?: string;
}
