import { ArrayMinSize, ArrayUnique, IsArray, IsIn } from 'class-validator';
import { ONBOARDING_MODULE_IDS } from '../../users/users.constants';

export class UpdateOnboardingModulesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(ONBOARDING_MODULE_IDS, { each: true })
  selectedModuleIds!: (typeof ONBOARDING_MODULE_IDS)[number][];
}
