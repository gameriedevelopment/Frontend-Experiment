export type ReferralStatus = "active" | "inactive" | "expired";
export type ReferralSummary = Record<ReferralStatus | "total", number>;

export interface ReferralCode {
  id: string;
  code: string;
  source: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  signups: number;
  eligible: number;
  eligibleUnpaid: number;
  paid: number;
}

export interface ReferralSignup {
  id: string;
  userId: string;
  username: string;
  email: string;
  profileImage: string | null;
  status: "pending" | "qualified" | "rewarded" | "rejected";
  eligibilityStatus: "pending" | "eligible";
  eligibleAt: string | null;
  paymentStatus: "unpaid" | "paid";
  paidAt: string | null;
  level: number;
  recordedMatchCount: number;
  createdAt: string;
  profileCompletion: { score: number; complete: boolean } | null;
}

export interface ListQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface ReferralInput {
  code: string;
  source: string;
  expiresAt?: string;
  reason: string;
}
