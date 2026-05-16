export type PublicUser = {
  id: string;
  email: string;
  onboardingCompleted: boolean;
  enabledModuleIds: string[];
  businessProfile: {
    name: string | null;
    category: string | null;
    currencyCode: string | null;
  };
};
