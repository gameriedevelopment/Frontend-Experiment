import { api, type ApiEnvelope } from "@/lib/api";
import type { CommunityInvite, CommunityKind, HubSummary, TeamSummary } from "./types";

export async function getUserTeams(userId: string): Promise<TeamSummary[]> {
  const { data } = await api.get<ApiEnvelope<TeamSummary[]>>(`/teams/user/${userId}`);
  return Array.isArray(data.data) ? data.data : [];
}

export async function getTeamInvites() {
  const { data } = await api.get<ApiEnvelope<CommunityInvite<TeamSummary>[]>>("/teams/invites/mine");
  return data.data;
}

export async function getHubInvites() {
  const { data } = await api.get<ApiEnvelope<CommunityInvite<HubSummary>[]>>("/hubs/invites/mine");
  return data.data;
}

export async function respondToInvite(kind: CommunityKind, id: string, accept: boolean) {
  const path =
    kind === "team"
      ? `/teams/invite/${id}/${accept ? "accept" : "decline"}`
      : `/hubs/request/${id}/${accept ? "accept" : "reject"}`;
  await api.patch(path);
}
