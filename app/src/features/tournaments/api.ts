import { api, type ApiEnvelope } from "@/lib/api";
import type { TournamentFilters, TournamentPageData } from "./types";

export async function getTournaments(filters: TournamentFilters, page = 1, limit = 12): Promise<TournamentPageData> {
  const { data } = await api.get<ApiEnvelope<TournamentPageData>>("/tournaments", {
    params: {
      search: filters.search || undefined,
      game: filters.game || undefined,
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
