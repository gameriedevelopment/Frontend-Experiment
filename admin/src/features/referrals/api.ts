import { api, unwrap, type AdminPage } from "@/lib/api";
import type { ListQuery, ReferralCode, ReferralInput, ReferralSignup, ReferralStatus, ReferralSummary } from "./types";

export const referralKey = ["admin", "referrals"] as const;
const base = "/admin/growth/referrals";

export const listReferralCodes = (query: ListQuery & { status?: ReferralStatus }) =>
  unwrap<AdminPage<ReferralCode>>(api.get(base, { params: query }));
export const getReferralSummary = () => unwrap<ReferralSummary>(api.get(`${base}/summary`));
export const getReferralCode = (id: string) => unwrap<ReferralCode>(api.get(`${base}/${id}`));
export const createReferralCode = (input: ReferralInput) =>
  unwrap<{ id: string }>(api.post(base, input));
export const listReferralSignups = (id: string, query: ListQuery) =>
  unwrap<AdminPage<ReferralSignup>>(api.get(`${base}/${id}/signups`, { params: query }));
export const updateReferralStatus = (id: string, status: "active" | "inactive", reason: string) =>
  unwrap(api.patch(`${base}/${id}/status`, { status, reason }));
export const updateReferralPayment = (id: string, paid: boolean, reason: string) =>
  unwrap(api.patch(`/admin/growth/referral-signups/${id}/payment`, { paid, reason }));
export const deleteReferralCode = (id: string, reason: string) =>
  unwrap(api.delete(`${base}/${id}`, { data: { reason } }));
