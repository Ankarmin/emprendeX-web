export type PublicUser = {
  id: string;
  firstNames: string;
  lastNames: string;
  email: string;
  phone: string;
  status: 'Inactive' | 'Active' | 'Blocked';
  onboardingCompleted: boolean;
  enabledModuleIds: string[];
  businessProfile: {
    id: string | null;
    name: string | null;
    category: string | null;
  };
};
