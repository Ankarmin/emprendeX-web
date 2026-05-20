import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  unitName!: string;
}
