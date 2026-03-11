export type AuthUser = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  isVerified: boolean;
  userType: {
    id: string;
    name: string;
  };
};

export type RequestContext = {
  authToken: string;
  countryCode: string;
  currency?: string;
};
