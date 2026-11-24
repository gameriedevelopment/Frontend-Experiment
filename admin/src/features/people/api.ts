import { api, unwrap } from "@/lib/api";
import type { PeopleSummary, SearchResult } from "./types";

export const getPeopleSummary = () => unwrap<PeopleSummary>(api.get("/admin/people/summary"));

export const searchEverything = (q: string) => unwrap<SearchResult[]>(api.get("/admin/search", { params: { q } }));

export type ModeratedKind = "users" | "teams" | "hubs";

/** Ban or lift a ban; the reason goes on the audit log. */
export const setBan = (kind: ModeratedKind, id: string, ban: boolean, reason: string) =>
  api.patch(`/admin/${kind}/${id}/ban`, { ban, reason });

/** Permanent removal, with the reason on the audit log. */
export const deleteRecord = (kind: ModeratedKind, id: string, reason: string) => api.delete(`/admin/${kind}/${id}`, { data: { reason } });
