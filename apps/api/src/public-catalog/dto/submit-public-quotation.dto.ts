import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { DeliveryMethod } from '../../database/database.enums';
import {
  DNI_REGEX,
  DNI_VALIDATION_MESSAGE,
  transformTrimmedString,
} from '../../common/utils/dni.util';
import {
  MAX_PUBLIC_ITEM_QUANTITY,
  MAX_PUBLIC_QUOTATION_ITEMS,
} from '../public-catalog.config';

class SubmitPublicQuotationCustomerDto {
  @IsIn(['new', 'existing'])
  mode!: 'new' | 'existing';

  @Transform(transformTrimmedString)
  @IsString()
  @Matches(DNI_REGEX, { message: DNI_VALIDATION_MESSAGE })
  dni!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstNames?: string;

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
  @MaxLength(1000)
  address?: string;
}

class SubmitPublicQuotationItemDto {
  @IsUUID()
  itemId!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_PUBLIC_ITEM_QUANTITY)
  quantity!: number;
}

export class SubmitPublicQuotationDto {
  @ValidateNested()
  @Type(() => SubmitPublicQuotationCustomerDto)
  customer!: SubmitPublicQuotationCustomerDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_PUBLIC_QUOTATION_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => SubmitPublicQuotationItemDto)
  items!: SubmitPublicQuotationItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsDateString()
  deliveryDate!: string;

  @IsEnum(DeliveryMethod)
  deliveryMethod!: DeliveryMethod;

  @IsOptional()
  @IsString()
  turnstileToken?: string;
}
