import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateOnboardingSetupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessCategory!: string;
}
