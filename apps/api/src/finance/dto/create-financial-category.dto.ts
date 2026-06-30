import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFinancialCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría financiera',
    example: 'Servicios básicos',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}
