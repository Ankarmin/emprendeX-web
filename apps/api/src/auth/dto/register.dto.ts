import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  DNI_REGEX,
  DNI_VALIDATION_MESSAGE,
  transformTrimmedString,
} from '../../common/utils/dni.util';

export class RegisterDto {
  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({
    description: 'Documento Nacional de Identidad',
    example: '12345678',
  })
  @Transform(transformTrimmedString)
  @IsString()
  @Matches(DNI_REGEX, { message: DNI_VALIDATION_MESSAGE })
  dni!: string;

  @ApiProperty({ description: 'Número de teléfono', example: '999888777' })
  @IsString()
  @Matches(/^\+?[0-9]{6,20}$/)
  phone!: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 8 caracteres)',
    example: 'MiPassword123',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({
    description: 'Nombre del negocio o emprendimiento',
    example: 'Panadería Delicias',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName!: string;

  @ApiProperty({
    description: 'Categoría del negocio',
    example: 'Alimentos y Bebidas',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessCategory!: string;
}
