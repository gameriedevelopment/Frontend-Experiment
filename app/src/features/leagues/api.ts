import { api } from "@/lib/api";
import type {
  LeagueActivity,
  LeagueBasicsInput,
  LeagueDetail,
  LeagueEntryInput,
  LeagueFilters,
  LeagueFinish,
  LeagueFixture,
  LeagueGroup,
  LeagueHostedSeason,
  LeagueHostingOptions,
  LeagueLeaderboardEntry,
  LeaguePage,
  LeagueParticipant,
  LeagueParticipantStatus,
  LeaguePlayoffs,
  LeagueRoster,
  LeagueSeasonListItem,
  LeagueStandings,
  Paged,
  SaveLeagueDraftInput,
  UpdateLeagueInput,
} from "./types";

type Envelope<T> = { data: T };

const unwrap = <T>(response: { data: Envelope<T> }) => response.data.data;
const league = (id: string) => `/leagues/${encodeURIComponent(id)}`;
const season = (id: string, seasonId: string) => `${league(id)}/seasons/${encodeURIComponent(seasonId)}`;
const fixture = (id: string, seasonId: string, fixtureId: string) =>
  `${season(id, seasonId)}/fixtures/${encodeURIComponent(fixtureId)}`;

export function getLeagues(filters: LeagueFilters, page = 1, limit = 12) {
  return api
    .get<Envelope<LeaguePage>>("/leagues", {
      params: {
        view: filters.view,
        search: filters.search || undefined,
        game: filters.game || undefined,
        platform: filters.platform || undefined,
        region: filters.region || undefined,
        entrantType: filters.entrantType || undefined,
        joinMode: filters.joinMode || undefined,
        hostType: filters.hostType || undefined,
        official: filters.official || undefined,
        page,
        limit,
      },
    })
    .then(unwrap);
}

export const getLeague = (id: string, seasonId?: string) =>
  api.get<Envelope<LeagueDetail>>(league(id), { params: { season: seasonId || undefined } }).then(unwrap);

export const getLeagueHostingOptions = () =>
  api.get<Envelope<LeagueHostingOptions>>("/leagues/hosting-options").then(unwrap);

export const createLeagueDraft = (basics: LeagueBasicsInput) =>
  api.post<Envelope<LeagueDetail>>("/leagues/drafts", { basics }).then(unwrap);

export const saveLeagueDraft = (id: string, input: SaveLeagueDraftInput) =>
  api.patch<Envelope<LeagueDetail>>(`${league(id)}/draft`, input).then(unwrap);

export const publishLeague = (id: string) => api.post<Envelope<LeagueDetail>>(`${league(id)}/publish`).then(unwrap);

export const updateLeague = (id: string, input: UpdateLeagueInput) =>
  api.patch<Envelope<LeagueDetail>>(league(id), input).then(unwrap);

/** Deleted outright when nothing was played; otherwise removed, keeping players' results. */
export const deleteLeague = (id: string) =>
  api.delete<Envelope<{ outcome: "deleted" | "removed" }>>(league(id)).then(unwrap);

export function uploadLeagueImage(id: string, file: File, kind: "banner" | "logo") {
  const body = new FormData();
  body.append("file", file);
  return api
    .post<Envelope<Record<string, string>>>(`${league(id)}/${kind}`, body, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(unwrap);
}

export const openNextSeason = (id: string, input: { startsAt: string; endsAt: string; carryOver: boolean }) =>
  api.post<Envelope<LeagueDetail>>(`${league(id)}/seasons`, input).then(unwrap);

export const getLeagueSeasons = (id: string) =>
  api.get<Envelope<LeagueSeasonListItem[]>>(`${league(id)}/seasons`).then(unwrap);

export const getLeagueParticipants = (id: string, seasonId: string, status?: LeagueParticipantStatus[]) =>
  api
    .get<Envelope<LeagueParticipant[]>>(`${season(id, seasonId)}/participants`, {
      params: { status: status?.length ? status.join(",") : undefined },
    })
    .then(unwrap);

export const joinLeague = (id: string, seasonId: string, input: LeagueEntryInput) =>
  api.post<Envelope<LeagueParticipant>>(`${season(id, seasonId)}/join`, input).then(unwrap);

export const withdrawFromLeague = (id: string, seasonId: string, participantId: string) =>
  api.post(`${season(id, seasonId)}/participants/${encodeURIComponent(participantId)}/withdraw`).then(unwrap);

export const respondToLeagueInvitation = (
  id: string,
  seasonId: string,
  participantId: string,
  input: LeagueEntryInput & { action: "accept" | "decline" },
) => api.post(`${season(id, seasonId)}/invitations/${encodeURIComponent(participantId)}/respond`, input).then(unwrap);

export const inviteToLeague = (id: string, seasonId: string, targetId: string) =>
  api.post(`${season(id, seasonId)}/manage/invitations`, { targetId }).then(unwrap);

export const reviewLeagueEntry = (id: string, seasonId: string, participantId: string, approve: boolean) =>
  api
    .post(`${season(id, seasonId)}/manage/entries/${encodeURIComponent(participantId)}/${approve ? "approve" : "decline"}`)
    .then(unwrap);

export const removeLeagueParticipant = (
  id: string,
  seasonId: string,
  participantId: string,
  input: { mode: "void" | "forfeit_rest"; reason: string },
) => api.post(`${season(id, seasonId)}/manage/participants/${encodeURIComponent(participantId)}/remove`, input).then(unwrap);

const rosterPath = (id: string, seasonId: string, participantId: string) =>
  `${season(id, seasonId)}/participants/${encodeURIComponent(participantId)}/roster`;

export const getLeagueRoster = (id: string, seasonId: string, participantId: string) =>
  api.get<Envelope<LeagueRoster>>(rosterPath(id, seasonId, participantId)).then(unwrap);

export const addLeagueRosterMember = (
  id: string,
  seasonId: string,
  participantId: string,
  input: { userId: string; role: "player" | "substitute" },
) => api.post(rosterPath(id, seasonId, participantId), input).then(unwrap);

export const removeLeagueRosterMember = (id: string, seasonId: string, participantId: string, userId: string) =>
  api.delete(`${rosterPath(id, seasonId, participantId)}/${encodeURIComponent(userId)}`).then(unwrap);

export const getLeagueStandings = (id: string, seasonId: string) =>
  api.get<Envelope<LeagueStandings>>(`${season(id, seasonId)}/standings`).then(unwrap);

export const getLeagueFixtures = (
  id: string,
  seasonId: string,
  query: { week?: number; stage?: "regular" | "playoffs"; mine?: boolean } = {},
) =>
  api
    .get<Envelope<LeagueFixture[]>>(`${season(id, seasonId)}/fixtures`, {
      params: { week: query.week, stage: query.stage, mine: query.mine || undefined },
    })
    .then(unwrap);

export const getLeaguePlayoffs = (id: string, seasonId: string) =>
  api.get<Envelope<LeaguePlayoffs>>(`${season(id, seasonId)}/playoffs`).then(unwrap);

export const getLeagueGroups = (id: string, seasonId: string) =>
  api.get<Envelope<LeagueGroup[]>>(`${season(id, seasonId)}/groups`).then(unwrap);

export const assignLeagueGroups = (
  id: string,
  seasonId: string,
  assignments: Array<{ participantId: string; groupId: string }>,
) => api.post(`${season(id, seasonId)}/manage/groups/assign`, { assignments }).then(unwrap);

export const randomizeLeagueGroups = (id: string, seasonId: string) =>
  api.post(`${season(id, seasonId)}/manage/groups/randomize`).then(unwrap);

export const getLeagueReports = (id: string, seasonId: string) =>
  api.get<Envelope<LeagueFixture[]>>(`${season(id, seasonId)}/manage/reports`).then(unwrap);

export const moveLeagueFixture = (id: string, seasonId: string, fixtureId: string, defaultAt: string) =>
  api.patch(`${season(id, seasonId)}/manage/fixtures/${encodeURIComponent(fixtureId)}`, { defaultAt }).then(unwrap);

export type LeagueFixtureAction =
  | { kind: "ready" }
  | { kind: "propose"; at: string }
  | { kind: "accept-time" }
  | { kind: "result"; scoreA: number; scoreB: number; notes?: string }
  | { kind: "accept-result" }
  | { kind: "dispute"; reason: string };

export function actOnLeagueFixture(id: string, seasonId: string, fixtureId: string, action: LeagueFixtureAction) {
  const path = fixture(id, seasonId, fixtureId);
  switch (action.kind) {
    case "ready":
      return api.post(`${path}/ready`).then(unwrap);
    case "propose":
      return api.post(`${path}/propose`, { at: action.at }).then(unwrap);
    case "accept-time":
      return api.post(`${path}/accept-time`).then(unwrap);
    case "result":
      return api.post(`${path}/result`, { scoreA: action.scoreA, scoreB: action.scoreB, notes: action.notes }).then(unwrap);
    case "accept-result":
      return api.post(`${path}/result/accept`).then(unwrap);
    case "dispute":
      return api.post(`${path}/result/dispute`, { reason: action.reason }).then(unwrap);
  }
}

export const getLeagueAnnouncements = (id: string) =>
  api.get<Envelope<Paged<LeagueActivity>>>(`${league(id)}/announcements`).then(unwrap);

export const announceToLeague = (id: string, input: { title?: string; message: string }) =>
  api.post(`${league(id)}/manage/announcements`, input).then(unwrap);

export const getLeagueActivity = (id: string, page = 1) =>
  api.get<Envelope<Paged<LeagueActivity>>>(`${league(id)}/manage/activity`, { params: { page } }).then(unwrap);

export const getLeagueFinishes = (subject: { userId: string } | { teamId: string }) =>
  api
    .get<Envelope<{ items: LeagueFinish[]; summary: { seasons: number; titles: number; podiums: number } }>>(
      "/leagues/results",
      { params: subject },
    )
    .then(unwrap);

export const getHostedLeagueSeasons = (hubId: string) =>
  api
    .get<Envelope<{ items: LeagueHostedSeason[]; summary: { seasons: number } }>>("/leagues/results", {
      params: { hubId },
    })
    .then(unwrap);

export const getLeagueLeaderboard = (kind: "player" | "team", game?: string, page = 1) =>
  api
    .get<Envelope<Paged<LeagueLeaderboardEntry>>>("/leagues/leaderboard", {
      params: { kind, game: game || undefined, page, limit: 20 },
    })
    .then(unwrap);
