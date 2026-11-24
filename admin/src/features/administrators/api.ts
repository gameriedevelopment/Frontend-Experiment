import { api, unwrap, type AdminPage } from "@/lib/api";
import type { Administrator, AdministratorInvite, DirectoryQuery } from "./types";

export const administratorsKey = ["admin", "administrators"] as const;

export const listAdministrators = (query: DirectoryQuery) =>
  unwrap<AdminPage<Administrator>>(api.get("/admin/operators", { params: query }));
export const listAdministratorInvites = (query: DirectoryQuery) =>
  unwrap<AdminPage<AdministratorInvite>>(api.get("/admin/operator-invites", { params: query }));
export const inviteAdministrator = (email: string) =>
  unwrap(api.post("/admin/operators/invite", { email }));
export const updateAdministrator = (id: string, status: Administrator["status"], reason: string) =>
  unwrap(api.patch(`/admin/operators/${id}`, { status, reason }));
export const removeAdministrator = (id: string, reason: string) =>
  unwrap(api.delete(`/admin/operators/${id}`, { data: { reason } }));
export const resendAdministratorInvite = (id: string) =>
  unwrap(api.post(`/admin/operator-invites/${id}/resend`));
export const revokeAdministratorInvite = (id: string) =>
  unwrap(api.delete(`/admin/operator-invites/${id}`));
