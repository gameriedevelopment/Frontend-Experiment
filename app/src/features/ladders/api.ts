import { api } from "@/lib/api";
import type {
  LadderDetail,
  LadderFilters,
  LadderHostingOptions,
  LadderPageData,
  LadderBasicsInput,
  SaveLadderDraftInput,
  LadderChallenge,
  LadderParticipant,
  LadderStanding,
  Paginated,
  LadderActivity,
  LadderEntryInput,
  LadderGroup,
  LadderLeaderboardPage,
  UpdateLadderInput,
  LadderFinish,
  LadderHosted,
  LadderRoster,
  LadderRosterMember,
  LadderStaffMember,
  LadderStaffRole,
} from "./types";

type Envelope<T> = { data: T };

const unwrap = <T>(response: { data: Envelope<T> }) => response.data.data;

export async function getLadders(filters: LadderFilters, page = 1, limit = 12) {
  return api
    .get<Envelope<LadderPageData>>("/ladders", {
      params: {
        ...filters,
        search: filters.search || undefined,
        gameId: filters.gameId || undefined,
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

export const getLadder = (id: string) =>
  api.get<Envelope<LadderDetail>>(`/ladders/${encodeURIComponent(id)}`).then(unwrap);

export const getLadderHostingOptions = () =>
  api.get<Envelope<LadderHostingOptions>>("/ladders/hosting-options").then(unwrap);

export const createLadderDraft = (basics: LadderBasicsInput) =>
  api.post<Envelope<LadderDetail>>("/ladders/drafts", { basics }).then(unwrap);

export const saveLadderDraft = (id: string, input: SaveLadderDraftInput) =>
  api
    .patch<Envelope<LadderDetail>>(`/ladders/${encodeURIComponent(id)}/settings`, input)
    .then(unwrap);

export const updateLadder = (id: string, input: UpdateLadderInput) =>
  api.patch<Envelope<LadderDetail>>(`/ladders/${encodeURIComponent(id)}`, input).then(unwrap);

export function uploadLadderBanner(id: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return api
    .post<Envelope<{ banner: string }>>(`/ladders/${encodeURIComponent(id)}/banner`, body, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(unwrap);
}

export function uploadLadderLogo(id: string, file: File) {
  const body = new FormData();
  body.append("file", file);
  return api
    .post<Envelope<{ logo: string }>>(`/ladders/${encodeURIComponent(id)}/logo`, body, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(unwrap);
}

export const runLadderAgain = (id: string) =>
  api.post<Envelope<LadderDetail>>(`/ladders/${encodeURIComponent(id)}/run-again`).then(unwrap);

export const getLadderFinishes = (subject: { userId: string } | { teamId: string }) =>
  api
    .get<Envelope<{ items: LadderFinish[]; summary: { ladders: number; titles: number; podiums: number } }>>(
      "/ladders/results",
      { params: subject },
    )
    .then(unwrap);

export const getHostedLadders = (hubId: string) =>
  api
    .get<Envelope<{ items: LadderHosted[]; summary: { ladders: number } }>>("/ladders/results", {
      params: { hubId },
    })
    .then(unwrap);

const rosterPath = (id: string, participantId: string) =>
  `/ladders/${encodeURIComponent(id)}/participants/${encodeURIComponent(participantId)}/roster`;

export const getLadderRoster = (id: string, participantId: string) =>
  api.get<Envelope<LadderRoster>>(rosterPath(id, participantId)).then(unwrap);

export const addLadderRosterMember = (
  id: string,
  participantId: string,
  input: { userId: string; role: LadderRosterMember["role"] },
) => api.post<Envelope<LadderRoster>>(rosterPath(id, participantId), input).then(unwrap);

export const removeLadderRosterMember = (id: string, participantId: string, userId: string) =>
  api
    .delete<Envelope<LadderRoster>>(`${rosterPath(id, participantId)}/${encodeURIComponent(userId)}`)
    .then(unwrap);

export const getLadderLeaderboard = (kind: "player" | "team", game?: string, page = 1) =>
  api
    .get<Envelope<LadderLeaderboardPage>>("/ladders/leaderboard", {
      params: { kind, game: game || undefined, page, limit: 20 },
    })
    .then(unwrap);

export const publishLadder = (id: string) =>
  api.post<Envelope<LadderDetail>>(`/ladders/${encodeURIComponent(id)}/publish`).then(unwrap);

export const joinLadder = (id: string, input: LadderEntryInput = {}) =>
  api
    .post<Envelope<LadderParticipant>>(`/ladders/${encodeURIComponent(id)}/join`, input)
    .then(unwrap);

export const getLadderParticipants = (id: string, manage = false, status?: string) =>
  api
    .get<Envelope<Paginated<LadderParticipant>>>(
      `/ladders/${encodeURIComponent(id)}/${manage ? "manage/entries" : "participants"}`,
      { params: { page: 1, limit: 50, status } },
    )
    .then(unwrap);

export const getLadderStandings = (id: string) =>
  api.get<Envelope<LadderStanding[]>>(`/ladders/${encodeURIComponent(id)}/standings`).then(unwrap);

export const getLadderMatches = (id: string) =>
  api
    .get<Envelope<Paginated<LadderChallenge>>>(`/ladders/${encodeURIComponent(id)}/matches`, {
      params: { page: 1, limit: 50 },
    })
    .then(unwrap);

export const createLadderChallenge = (
  id: string,
  input: {
    challengerParticipantId: string;
    opponentParticipantId: string;
    scheduledDate: string;
    mode?: string;
    message?: string;
  },
) =>
  api
    .post<Envelope<LadderChallenge>>(`/ladders/${encodeURIComponent(id)}/challenges`, input)
    .then(unwrap);

export const respondToLadderChallenge = (
  id: string,
  challengeId: string,
  action: "accept" | "reject",
) =>
  api
    .post<Envelope<LadderChallenge>>(
      `/ladders/${encodeURIComponent(id)}/challenges/${encodeURIComponent(challengeId)}/${action}`,
    )
    .then(unwrap);

export const declareLadderResult = (
  id: string,
  challengeId: string,
  input: {
    winnerParticipantId?: string;
    outcome?: "draw";
    challengerScore: number;
    challengedScore: number;
  },
) =>
  api
    .post<Envelope<LadderChallenge>>(
      `/ladders/${encodeURIComponent(id)}/challenges/${encodeURIComponent(challengeId)}/result`,
      input,
    )
    .then(unwrap);

export const reviewLadderResult = (id: string, challengeId: string, action: "accept" | "dispute") =>
  api
    .post<Envelope<LadderChallenge>>(
      `/ladders/${encodeURIComponent(id)}/challenges/${encodeURIComponent(challengeId)}/result/${action}`,
    )
    .then(unwrap);

export const reviewLadderEntry = (
  id: string,
  participantId: string,
  action: "approve" | "decline",
) =>
  api
    .post<Envelope<LadderParticipant>>(
      `/ladders/${encodeURIComponent(id)}/manage/entries/${encodeURIComponent(participantId)}/${action}`,
    )
    .then(unwrap);

export const inviteLadderParticipant = (id: string, targetId: string) =>
  api
    .post<Envelope<LadderParticipant>>(`/ladders/${encodeURIComponent(id)}/manage/invitations`, {
      targetId,
    })
    .then(unwrap);

export const respondToLadderInvitation = (
  id: string,
  participantId: string,
  action: "accept" | "decline",
  input: LadderEntryInput = {},
) =>
  api
    .post<Envelope<LadderParticipant>>(
      `/ladders/${encodeURIComponent(id)}/invitations/${encodeURIComponent(participantId)}/respond`,
      { ...input, action },
    )
    .then(unwrap);

export const withdrawLadderParticipant = (id: string, participantId: string) =>
  api
    .post<Envelope<LadderParticipant>>(
      `/ladders/${encodeURIComponent(id)}/participants/${encodeURIComponent(participantId)}/withdraw`,
    )
    .then(unwrap);

export const removeLadderParticipant = (id: string, participantId: string) =>
  api
    .post<Envelope<LadderParticipant>>(
      `/ladders/${encodeURIComponent(id)}/manage/participants/${encodeURIComponent(participantId)}/remove`,
    )
    .then(unwrap);

export const getLadderGroups = (id: string) =>
  api.get<Envelope<LadderGroup[]>>(`/ladders/${encodeURIComponent(id)}/manage/groups`).then(unwrap);

export const assignLadderGroups = (
  id: string,
  assignments: Array<{ participantId: string; groupId: string }>,
) =>
  api
    .post<Envelope<LadderGroup[]>>(`/ladders/${encodeURIComponent(id)}/manage/groups/assign`, {
      assignments,
    })
    .then(unwrap);

export const randomizeLadderGroups = (id: string) =>
  api
    .post<Envelope<LadderGroup[]>>(`/ladders/${encodeURIComponent(id)}/manage/groups/randomize`)
    .then(unwrap);

export const getLadderAnnouncements = (id: string) =>
  api
    .get<Envelope<Paginated<LadderActivity>>>(`/ladders/${encodeURIComponent(id)}/announcements`, {
      params: { page: 1, limit: 20 },
    })
    .then(unwrap);

export const getLadderActivity = (id: string) =>
  api
    .get<Envelope<Paginated<LadderActivity>>>(
      `/ladders/${encodeURIComponent(id)}/manage/activity`,
      {
        params: { page: 1, limit: 30 },
      },
    )
    .then(unwrap);

export const postLadderAnnouncement = (id: string, input: { title?: string; message: string }) =>
  api
    .post<Envelope<LadderActivity>>(
      `/ladders/${encodeURIComponent(id)}/manage/announcements`,
      input,
    )
    .then(unwrap);

const staffPath = (id: string) => `/ladders/${encodeURIComponent(id)}/manage/staff`;

export const getLadderStaff = (id: string) => api.get<Envelope<LadderStaffMember[]>>(staffPath(id)).then(unwrap);

export const setLadderStaff = (id: string, userId: string, role: LadderStaffRole) =>
  api.post<Envelope<LadderStaffMember[]>>(staffPath(id), { userId, role }).then(unwrap);

export const removeLadderStaff = (id: string, userId: string) =>
  api.delete(`${staffPath(id)}/${encodeURIComponent(userId)}`).then(unwrap);
