import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  DNI_REGEX,
  DNI_VALIDATION_MESSAGE,
  transformTrimmedString,
} from '../../common/utils/dni.util';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @Transform(transformTrimmedString)
  @IsString()
  @Matches(DNI_REGEX, { message: DNI_VALIDATION_MESSAGE })
  dni!: string;

  @IsString()
  @Matches(/^\+?[0-9]{6,20}$/)
  phone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessCategory!: string;
}
