import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
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

export class CreateCustomerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstNames!: string;

  @Transform(transformTrimmedString)
  @IsString()
  @Matches(DNI_REGEX, { message: DNI_VALIDATION_MESSAGE })
  dni!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastNames?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{6,20}$/)
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
