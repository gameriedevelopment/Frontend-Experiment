export interface AdminUser {
  id: string;
  email?: string;
  username?: string;
  profileImage?: string;
  role?: string;
  adminStatus?: "active" | "suspended";
  isSuperAdmin?: boolean;
}

export interface AdminInviteDetails {
  email: string;
  requiresPassword: boolean;
  requiresProfile: boolean;
  invitedByEmail?: string | null;
}

export interface AcceptInviteInput {
  token: string;
  password?: string;
  username?: string;
  fullName?: string;
}

export const isAdmin = (user: Pick<AdminUser, "role" | "adminStatus"> | null | undefined) =>
  user?.role?.toLowerCase() === "admin" && user.adminStatus !== "suspended";

export const operatorName = (user: AdminUser | null | undefined) => user?.username || user?.email?.split("@")[0] || "Operator";
