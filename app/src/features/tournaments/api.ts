import { api, type ApiEnvelope } from "@/lib/api";
import type {
  ActivityEntry,
  DraftPayload,
  HostedTournamentDetail,
  HostedTournamentSummary,
  HostingOptions,
  ManageOverview,
  PagedResult,
  TournamentBracket,
  TournamentFacets,
  TournamentFilters,
  TournamentLeaderRow,
  TournamentPageData,
  TournamentParticipant,
} from "./types";

const unwrap = <T>(response: { data: ApiEnvelope<T> }) => response.data.data;
const base = (id: string) => `/tournaments/${encodeURIComponent(id)}`;
const manage = (id: string) => `${base(id)}/manage`;

export async function getTournaments(filters: TournamentFilters, page = 1, limit = 12): Promise<TournamentPageData> {
  const { data } = await api.get<ApiEnvelope<TournamentPageData>>("/tournaments", {
    params: {
      search: filters.search || undefined,
      game: filters.game || undefined,
      platform: filters.platform || undefined,
      region: filters.region || undefined,
      skillLevel: filters.skillLevel || undefined,
      prizeMin: filters.prizeMin || undefined,
      teamSize: filters.teamSize || undefined,
      source: filters.source || undefined,
      entrantType: filters.entrantType || undefined,
      format: filters.format || undefined,
      status: filters.status,
      page,
      limit,
    },
  });
  return {
    tournaments: data.data.tournaments ?? [],
    total: Number(data.data.total ?? 0),
    page: Number(data.data.page ?? page),
    limit: Number(data.data.limit ?? limit),
    hasMore: Boolean(data.data.hasMore),
  };
}

export const getTournamentFacets = () => api.get<ApiEnvelope<TournamentFacets>>("/tournaments/facets").then(unwrap);

export const getHostingOptions = () =>
  api.get<ApiEnvelope<HostingOptions>>("/tournaments/hosting-options").then(unwrap);

export const getMyTournaments = (role: "all" | "hosting" | "entered", page: number) =>
  api
    .get<ApiEnvelope<PagedResult<HostedTournamentSummary>>>("/tournaments/mine", { params: { role, page, limit: 12 } })
    .then(unwrap);

export const getTournamentLeaderboard = (params: { kind: "player" | "team"; game?: string; page: number }) =>
  api
    .get<ApiEnvelope<PagedResult<TournamentLeaderRow>>>("/tournaments/leaderboard", { params: { ...params, limit: 20 } })
    .then(unwrap);

export const getHostedTournament = (id: string) => api.get<ApiEnvelope<HostedTournamentDetail>>(base(id)).then(unwrap);

export const getTournamentBracket = (id: string) =>
  api.get<ApiEnvelope<TournamentBracket>>(`${base(id)}/bracket`).then(unwrap);

export const getTournamentParticipants = (id: string) =>
  api.get<ApiEnvelope<TournamentParticipant[]>>(`${base(id)}/participants`).then(unwrap);

export interface RegistrationResult {
  entrantId: string;
  status: string;
  waitlistPosition: number | null;
}

export const registerForTournament = (
  id: string,
  payload: { teamId?: string; playerIds?: string[]; substituteIds?: string[] },
) => api.post<ApiEnvelope<RegistrationResult>>(`${base(id)}/register`, payload).then(unwrap);

export const withdrawEntrant = (id: string, entrantId: string) =>
  api.post(`${base(id)}/entrants/${entrantId}/withdraw`);

export const checkInEntrant = (id: string, entrantId: string) => api.post(`${base(id)}/entrants/${entrantId}/check-in`);

export const updateRoster = (id: string, entrantId: string, roster: { playerIds: string[]; substituteIds?: string[] }) =>
  api.put(`${base(id)}/entrants/${entrantId}/roster`, roster);

export const answerInvitation = (
  id: string,
  entrantId: string,
  accept: boolean,
  roster?: { teamId?: string; playerIds?: string[]; substituteIds?: string[] },
) =>
  api.post(
    `${base(id)}/entrants/${entrantId}/invitation/${accept ? "accept" : "decline"}`,
    accept ? (roster ?? {}) : undefined,
  );

export const markReady = (id: string, matchId: string) => api.post(`${base(id)}/matches/${matchId}/ready`);

export const declareScore = (id: string, matchId: string, scoreA: number, scoreB: number) =>
  api.post(`${base(id)}/matches/${matchId}/score`, { scoreA, scoreB });

export const acceptResult = (id: string, matchId: string) => api.post(`${base(id)}/matches/${matchId}/accept-result`);

export const proposeMatchTime = (id: string, matchId: string, scheduledAt: string, note?: string) =>
  api.post(`${base(id)}/matches/${matchId}/time-proposals`, { scheduledAt, note });

export const respondToProposal = (
  id: string,
  matchId: string,
  payload: { action: "accept" | "counter"; scheduledAt?: string; note?: string },
) => api.post(`${base(id)}/matches/${matchId}/time-proposals/respond`, payload);

export const setMatchTime = (id: string, matchId: string, scheduledAt: string) =>
  api.post(`${manage(id)}/matches/${matchId}/schedule`, { scheduledAt });

/* Hosting */

export const createTournamentDraft = (basics: DraftPayload["basics"]) =>
  api.post<ApiEnvelope<HostedTournamentSummary>>("/tournaments/drafts", { basics }).then(unwrap);

export const saveTournamentSettings = (id: string, payload: DraftPayload) =>
  api.patch<ApiEnvelope<HostedTournamentSummary>>(`${base(id)}/settings`, payload).then(unwrap);

export function uploadTournamentBanner(id: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return api
    .post<ApiEnvelope<{ banner: string }>>(`${base(id)}/banner`, body, { headers: { "Content-Type": "multipart/form-data" } })
    .then(unwrap);
}

export const publishTournament = (id: string, visibility: "public" | "unlisted") =>
  api.post<ApiEnvelope<HostedTournamentSummary>>(`${base(id)}/publish`, { visibility }).then(unwrap);

export const deleteTournamentDraft = (id: string) => api.delete(base(id));

/* Organizer tools */

export const getManageOverview = (id: string) => api.get<ApiEnvelope<ManageOverview>>(`${manage(id)}/overview`).then(unwrap);

export const getActivityLog = (id: string, page: number) =>
  api.get<ApiEnvelope<PagedResult<ActivityEntry>>>(`${manage(id)}/activity`, { params: { page, limit: 25 } }).then(unwrap);

export type EntrantDecision = "approve" | "decline" | "remove" | "promote";

export const decideEntrant = (id: string, entrantId: string, decision: EntrantDecision, reason?: string) =>
  api.post(`${manage(id)}/entrants/${entrantId}/${decision}`, reason ? { reason } : {});

export const disqualifyEntrant = (
  id: string,
  entrantId: string,
  reason: string,
  roundRobinMode?: "forfeit_remaining" | "void_results",
) => api.post(`${manage(id)}/entrants/${entrantId}/disqualify`, { reason, roundRobinMode });

export const inviteEntrant = (id: string, kind: "player" | "team", entrantId: string) =>
  api.post(`${manage(id)}/invitations`, { kind, id: entrantId });

export const saveSeeding = (id: string, entrantIds: string[]) => api.put(`${manage(id)}/seeding`, { entrantIds });

export const decideStart = (
  id: string,
  payload: { decision: "start" | "delay" | "cancel"; startsAt?: string; reason?: string },
) => api.post(`${manage(id)}/start-decision`, payload);

export const pauseTournament = (id: string) => api.post(`${manage(id)}/pause`);
export const resumeTournament = (id: string) => api.post(`${manage(id)}/resume`);
export const cancelTournament = (id: string, reason: string) => api.post(`${manage(id)}/cancel`, { reason });
export const regenerateBracket = (id: string) => api.post(`${manage(id)}/regenerate`);

export const sendAnnouncement = (id: string, audience: "all" | "remaining", message: string) =>
  api.post(`${manage(id)}/announcements`, { audience, message });

export const transferOwnership = (id: string, userId: string) => api.post(`${manage(id)}/transfer`, { userId });
