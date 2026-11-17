export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isOnline?: boolean;
  profileImage?: string;
  region?: string | null;
  role?: string;
  gamerieId?: string | null;
  isFirstSocialLogin?: boolean;
  [key: string]: unknown;
}

export interface LoginResult {
  user: AuthUser;
  next: "feed" | "verify-phone";
}
