import { api, unwrap, type AdminPage } from "@/lib/api";
import type { LeagueDetail, LeagueFixture, LeagueQuery, LeagueRow, SeasonControl } from "./types";

const base = "/admin/leagues";

export const listLeagues = (query: LeagueQuery) => unwrap<AdminPage<LeagueRow>>(api.get(base, { params: query }));
export const getLeague = (id: string) => unwrap<LeagueDetail>(api.get(`${base}/${id}`));
export const getSeasonFixtures = (id: string, seasonId: string, status?: string) =>
  unwrap<LeagueFixture[]>(api.get(`${base}/${id}/seasons/${seasonId}/fixtures`, { params: { status: status || undefined } }));

export const controlSeason = (id: string, seasonId: string, action: SeasonControl, reason: string) =>
  api.post(`${base}/${id}/seasons/${seasonId}/control`, { action, reason });
export const correctFixture = (fixtureId: string, input: { scoreA: number; scoreB: number; reason: string }) => api.post(`${base}/fixtures/${fixtureId}/correct`, input);
export const cancelFixture = (fixtureId: string, reason: string) => api.post(`${base}/fixtures/${fixtureId}/cancel`, { reason });
export const removeLeague = (id: string, reason: string) => api.post(`${base}/${id}/remove`, { reason });
export const restoreLeague = (id: string) => api.post(`${base}/${id}/restore`);
