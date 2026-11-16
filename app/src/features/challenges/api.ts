import { api, type ApiEnvelope } from "@/lib/api";
import type {
  Challenge,
  ChallengeFilters,
  ChallengePageData,
  ChallengeType,
  ChallengeUpdate,
  CreateChallengePayload,
  EligibleLineupMember,
} from "./types";

export async function getMyChallenges(filters: ChallengeFilters, page = 1): Promise<ChallengePageData> {
  const { data } = await api.get<ApiEnvelope<ChallengePageData>>("/challenges/mine", {
    params: { ...filters, page, limit: 12, searchTerm: filters.searchTerm || undefined },
  });
  return data.data;
}

export async function getChallenge(id: string): Promise<Challenge> {
  const { data } = await api.get<ApiEnvelope<Challenge>>(`/challenges/${id}`);
  return data.data;
}

export async function createChallenge(payload: CreateChallengePayload): Promise<Challenge> {
  const { data } = await api.post<ApiEnvelope<Challenge>>("/challenges", payload);
  return data.data;
}

export async function getEligibleLineupMembers(teamId: string): Promise<EligibleLineupMember[]> {
  const { data } = await api.get<ApiEnvelope<EligibleLineupMember[]>>(`/challenges/team/${teamId}/eligible-lineup`);
  return data.data;
}

export async function updateTeamChallengeLineup(challengeId: string, teamId: string, playerIds: string[]) {
  const { data } = await api.put<ApiEnvelope<Challenge>>(`/challenges/${challengeId}/lineup`, { teamId, playerIds });
  return data.data;
}

export async function updateChallenge(id: string, type: ChallengeType, updates: ChallengeUpdate) {
  const { data } = await api.patch<ApiEnvelope<Challenge>>(`/challenges/${id}/${type}`, updates);
  return data.data;
}

export async function refreshChallenge(id: string, type: ChallengeType, scheduledDate: string) {
  const { data } = await api.patch<ApiEnvelope<Challenge>>(`/challenges/${id}/${type}/refresh`, { scheduledDate });
  return data.data;
}

export async function proposeReschedule(id: string, type: ChallengeType, scheduledDate: string) {
  const { data } = await api.patch<ApiEnvelope<Challenge>>(`/challenges/${id}/${type}/reschedule`, { scheduledDate });
  return data.data;
}

export async function respondReschedule(id: string, type: ChallengeType, accept: boolean) {
  const { data } = await api.patch<ApiEnvelope<Challenge>>(`/challenges/${id}/${type}/reschedule/respond`, {
    accept,
  });
  return data.data;
}

export async function deleteChallenge(id: string, type: ChallengeType): Promise<void> {
  await api.delete(`/challenges/${id}/${type}`);
}

export type ReportReason = "spam" | "harassment" | "inappropriate" | "other";

export interface ReportScorePayload {
  challengeId: string;
  contentAuthorId: string;
  type: ReportReason;
  reason: string;
}

export async function reportChallengeScore(payload: ReportScorePayload): Promise<void> {
  await api.post("/reports", {
    contentId: payload.challengeId,
    contentType: "match",
    contentAuthorId: payload.contentAuthorId,
    type: payload.type,
    reason: payload.reason,
  });
}
