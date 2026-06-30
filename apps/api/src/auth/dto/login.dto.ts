import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 6 caracteres)',
    example: 'MiPassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
