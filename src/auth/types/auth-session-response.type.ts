import { AuthStateResponse } from './auth-state-response.type';

export type AuthSessionResponse = AuthStateResponse & {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};
