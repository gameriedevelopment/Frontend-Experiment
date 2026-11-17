import { api, type ApiEnvelope } from "@/lib/api";
import type { LeaderboardFilters, LeaderboardPageData } from "./types";

export async function getLeaderboard(filters: LeaderboardFilters, page = 1, limit = 20): Promise<LeaderboardPageData> {
  const { data } = await api.get<ApiEnvelope<LeaderboardPageData>>("/leaderboard", {
    params: { ...filters, game: filters.game || undefined, page, limit },
  });
  return {
    data: data.data.data ?? [],
    total: Number(data.data.total ?? 0),
    page: Number(data.data.page ?? page),
    limit: Number(data.data.limit ?? limit),
    totalPages: Number(data.data.totalPages ?? 1),
  };
}
