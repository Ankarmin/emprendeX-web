export type PublicUser = {
  id: string;
  firstNames: string;
  lastNames: string;
  dni: string;
  email: string;
  phone: string;
  status: 'Inactive' | 'Active' | 'Blocked';
  onboardingCompleted: boolean;
  enabledModuleIds: string[];
  activeSubscription: {
    id: string;
    planName: string;
    period: string;
    price: string;
    endsAt: string;
    isActive: boolean;
    isPremium: boolean;
  } | null;
  businessProfile: {
    id: string | null;
    name: string | null;
    category: string | null;
  };
};
