import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOnboardingSetupDto {
  @ApiProperty({ description: 'Nombre del negocio o emprendimiento', example: 'Pastelería Dulce Hogar' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName!: string;

  @ApiProperty({ description: 'Categoría del negocio', example: 'Alimentos y bebidas' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessCategory!: string;
}
