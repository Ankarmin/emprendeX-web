import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { SUPPORTED_CURRENCIES } from '../../users/users.constants';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessCategory!: string;

  @IsString()
  @IsIn(SUPPORTED_CURRENCIES)
  currencyCode!: (typeof SUPPORTED_CURRENCIES)[number];
}
