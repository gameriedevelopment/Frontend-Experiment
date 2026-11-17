import { api, type ApiEnvelope } from "@/lib/api";
import type { PlayerProfile } from "@/features/profile/types";
import type { PlayerFilters, PlayerPage, SearchGame, SearchHub, SearchKind, SearchPage, SearchPost, SearchTeam } from "./types";

export async function getPlayers(filters: PlayerFilters, page = 1): Promise<PlayerPage> {
  const { data } = await api.get<ApiEnvelope<PlayerPage>>("/users", {
    params: {
      search: filters.search || undefined,
      gameLevel: filters.gameLevel || undefined,
      platform: filters.platform || undefined,
      game: filters.game || undefined,
      region: filters.region || undefined,
      canFetchCurrentUser: filters.includeCurrentUser ? true : false,
      page,
      limit: 12,
    },
  });
  return data.data;
}

export type SearchResult<K extends SearchKind> = K extends "players" ? PlayerProfile : K extends "teams" ? SearchTeam : K extends "hubs" ? SearchHub : K extends "posts" ? SearchPost : SearchGame;

export async function searchGamerie<K extends SearchKind>(kind: K, term: string, page = 1) {
  const { data } = await api.get<ApiEnvelope<SearchPage<SearchResult<K>>>>(`/search/${kind}`, {
    params: { term, page, limit: 12 },
  });
  return data.data;
}
