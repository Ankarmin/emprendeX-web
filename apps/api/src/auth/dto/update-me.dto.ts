import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeDto {
  @ApiPropertyOptional({ description: 'Nombre del usuario', example: 'Juan' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @ApiPropertyOptional({ description: 'Apellido del usuario', example: 'Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ description: 'Nombre del negocio o emprendimiento', example: 'Panadería Delicias' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName!: string;

  @ApiPropertyOptional({ description: 'Categoría del negocio', example: 'Alimentos y Bebidas' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessCategory!: string;
}
