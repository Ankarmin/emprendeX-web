import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryMethod } from '../../database/database.enums';

export class CreateQuotationDetailDto {
  @IsUUID()
  itemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @Matches(/^\d+(\.\d{1,2})?$/)
  unitPrice!: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  discount?: string;
}

export class CreateQuotationDto {
  @IsUUID()
  customerId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationDetailDto)
  details!: CreateQuotationDetailDto[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  deliveryDate!: string;

  @IsEnum(DeliveryMethod)
  deliveryMethod!: DeliveryMethod;
}
