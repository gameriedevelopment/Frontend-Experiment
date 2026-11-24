export interface Administrator {
  id: string;
  userId: string;
  email: string;
  username?: string | null;
  profileImage?: string | null;
  status: "active" | "suspended";
  isSuperAdmin: boolean;
  isProtected: boolean;
  invitedByEmail?: string | null;
  lastActiveAt?: string | null;
  lastLogin?: string | null;
  createdAt: string;
}

export interface AdministratorInvite {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  invitedByEmail?: string | null;
  createdAt: string;
}

export interface DirectoryQuery {
  page: number;
  limit: number;
  search?: string;
}
