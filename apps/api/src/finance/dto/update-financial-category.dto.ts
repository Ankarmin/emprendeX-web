import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFinancialCategoryDto {
  @ApiPropertyOptional({
    description: 'Nuevo nombre de la categoría financiera',
    example: 'Materiales de oficina',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;
}
