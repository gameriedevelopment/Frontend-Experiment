import { api, type ApiEnvelope } from "@/lib/api";
import type {
  AchievementsSummary,
  ConnectionPage,
  GameRanking,
  MatchHistoryPage,
  PlayerProfile,
} from "./types";

export async function getPlayerProfile(identity: string): Promise<PlayerProfile> {
  const legacyId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity);
  const endpoint = legacyId
    ? `/users/${identity}`
    : `/users/by-username/${encodeURIComponent(identity)}`;
  const { data } = await api.get<ApiEnvelope<PlayerProfile>>(endpoint);
  return data.data;
}

export async function getPublicPlayerCard(username: string): Promise<PlayerProfile> {
  const { data } = await api.get<ApiEnvelope<PlayerProfile>>(
    `/users/public-card/${encodeURIComponent(username)}`,
  );
  return data.data;
}

export async function followPlayer(currentUserId: string, targetUserId: string): Promise<void> {
  await api.post(`/users/${currentUserId}/follow/${targetUserId}`);
}

export async function unfollowPlayer(currentUserId: string, targetUserId: string): Promise<void> {
  await api.delete(`/users/${currentUserId}/unfollow/${targetUserId}`);
}

export async function getPlayerConnections(
  userId: string,
  kind: "followers" | "following",
  page: number,
): Promise<ConnectionPage> {
  const { data } = await api.get<ApiEnvelope<ConnectionPage>>(`/users/${kind}/all/${userId}`, {
    params: { page, limit: 20 },
  });
  return data.data;
}

export async function getPlayerRankings(userId: string): Promise<GameRanking[]> {
  const { data } = await api.get<ApiEnvelope<GameRanking[]>>(`/users/game-ranks/${userId}`);
  return data.data ?? [];
}

export async function getPlayerMatchPage(
  userId: string,
  page = 1,
  limit = 20,
  scope: "all" | "standalone" = "all",
): Promise<MatchHistoryPage> {
  const { data } = await api.get<ApiEnvelope<MatchHistoryPage>>(
    `/match-verification/players/${userId}/matches`,
    { params: { page, limit, scope } },
  );
  return data.data;
}

export async function toggleSkillEndorsement(
  endorserId: string,
  endorsedId: string,
  skillName: string,
): Promise<boolean> {
  const { data } = await api.post<ApiEnvelope<{ result: boolean }>>(
    `/users/${endorserId}/endorse`,
    { endorsedId, skillName },
  );
  return data.data.result;
}

export async function notifySkillEndorsement(payload: {
  userId: string;
  targetId: string;
  contentId: string;
}) {
  await api.post("/notifications/endorse-skill", {
    ...payload,
    contentType: "skill",
  });
}

export async function getAchievements(userId: string): Promise<AchievementsSummary> {
  const { data } = await api.get<ApiEnvelope<AchievementsSummary>>(`/achievements/${userId}`);
  return data.data;
}

export async function claimAchievement(userId: string, achievementId: string) {
  await api.post(`/achievements/${userId}/${achievementId}/claim`);
}
