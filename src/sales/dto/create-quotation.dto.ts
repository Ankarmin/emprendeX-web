import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { DeliveryMethod } from '../../database/database.enums';

export class CreateQuotationDto {
  @IsUUID()
  customerId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  itemIds!: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  deliveryDate!: string;

  @IsEnum(DeliveryMethod)
  deliveryMethod!: DeliveryMethod;
}
