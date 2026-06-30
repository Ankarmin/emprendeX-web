import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DNI_REGEX,
  DNI_VALIDATION_MESSAGE,
  transformTrimmedString,
} from '../../common/utils/dni.util';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Nombres del cliente', example: 'Juan Carlos' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstNames!: string;

  @ApiProperty({
    description: 'Documento Nacional de Identidad (DNI)',
    example: '12345678',
  })
  @Transform(transformTrimmedString)
  @IsString()
  @Matches(DNI_REGEX, { message: DNI_VALIDATION_MESSAGE })
  dni!: string;

  @ApiPropertyOptional({
    description: 'Apellidos del cliente',
    example: 'García López',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastNames?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico del cliente',
    example: 'cliente@ejemplo.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '999888777',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{6,20}$/)
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Dirección del cliente',
    example: 'Av. Principal 123, Lima',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
