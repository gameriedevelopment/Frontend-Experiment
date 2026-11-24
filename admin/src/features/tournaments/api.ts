import { api, unwrap, type AdminPage } from "@/lib/api";
import type { TournamentActivity, TournamentDetail, TournamentEntrant, TournamentQuery, TournamentRow } from "./types";

const base = "/admin/hosted-tournaments";

export const listTournaments = (query: TournamentQuery) => unwrap<AdminPage<TournamentRow>>(api.get(base, { params: query }));

export const getTournament = (id: string) => unwrap<TournamentDetail>(api.get(`${base}/${id}`));

export const getTournamentEntrants = async (id: string) => {
  const result = await unwrap<TournamentEntrant[] | { data: TournamentEntrant[] }>(api.get(`${base}/${id}/participants`));
  return Array.isArray(result) ? result : result.data;
};

export const getTournamentActivity = (id: string) =>
  unwrap<AdminPage<TournamentActivity>>(api.get(`${base}/${id}/manage/activity`, { params: { page: 1, limit: 30 } }));

export type TournamentControl = "pause" | "resume";

export const controlTournament = (id: string, action: TournamentControl) => api.post(`${base}/${id}/manage/${action}`);
export const cancelTournament = (id: string, reason: string) => api.post(`${base}/${id}/manage/cancel`, { reason });
export const removeTournament = (id: string, reason: string) => api.post(`${base}/${id}/remove`, { reason });
