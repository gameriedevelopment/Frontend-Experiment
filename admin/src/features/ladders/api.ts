import { api, unwrap, type AdminPage } from "@/lib/api";
import type { LadderDetail, LadderEntrants, LadderMatch, LadderMatchFilter, LadderQuery, LadderRow } from "./types";

const base = "/admin/ladders";

export const listLadders = (query: LadderQuery) => unwrap<AdminPage<LadderRow>>(api.get(base, { params: query }));
export const getLadder = (id: string) => unwrap<LadderDetail>(api.get(`${base}/${id}`));
export const getLadderEntrants = (id: string) => unwrap<LadderEntrants>(api.get(`${base}/${id}/participants`));
export const getLadderMatches = (id: string, status: LadderMatchFilter | undefined) =>
  unwrap<AdminPage<LadderMatch>>(api.get(`${base}/${id}/matches`, { params: { status, page: 1, limit: 50 } }));

export const correctLadderMatch = (
  id: string,
  matchId: string,
  input: { outcome?: "draw"; winnerParticipantId?: string; challengerScore: number; challengedScore: number; reason: string },
) => api.post(`${base}/${id}/matches/${matchId}/correct`, input);
export const cancelLadderMatch = (id: string, matchId: string, reason: string) => api.post(`${base}/${id}/matches/${matchId}/cancel`, { reason });
export const removeLadder = (id: string, reason: string) => api.post(`${base}/${id}/remove`, { reason });
export const restoreLadder = (id: string) => api.post(`${base}/${id}/restore`);
