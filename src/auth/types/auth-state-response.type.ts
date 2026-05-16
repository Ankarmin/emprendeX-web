import { PublicUser } from '../../users/types/public-user.type';

export type AuthStateResponse = {
  requiresOnboarding: boolean;
  user: PublicUser;
};
