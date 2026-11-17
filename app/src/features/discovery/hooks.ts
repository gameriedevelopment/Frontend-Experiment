import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getPlayers, searchGamerie } from "./api";
import type { PlayerFilters, SearchKind } from "./types";

/** First page of the directory. The key sits under ["discovery-players"] so follow updates patch it in place. */
export function usePlayerSuggestions(filters: PlayerFilters = {}) {
  return useQuery({
    queryKey: ["discovery-players", "suggestions", filters],
    queryFn: () => getPlayers(filters, 1),
    staleTime: 2 * 60_000,
  });
}

/** The search API rejects shorter terms. */
export const MIN_SEARCH_LENGTH = 2;

/** First page of a search, for pickers and the Top tab. Disabled until the term is long enough. */
export function useSearchResults<K extends SearchKind>(kind: K, term: string, enabled = true) {
  return useQuery({
    queryKey: ["unified-search", kind, term, "first-page"],
    queryFn: () => searchGamerie(kind, term),
    enabled: enabled && term.trim().length >= MIN_SEARCH_LENGTH,
    staleTime: 60_000,
  });
}

export function usePlayers(filters: PlayerFilters) {
  return useInfiniteQuery({
    queryKey: ["discovery-players", filters],
    queryFn: ({ pageParam }) => getPlayers(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    staleTime: 2 * 60_000,
  });
}

export function useUnifiedSearch(kind: SearchKind, term: string) {
  return useInfiniteQuery({
    queryKey: ["unified-search", kind, term],
    queryFn: ({ pageParam }) => searchGamerie(kind, term, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled: term.trim().length >= MIN_SEARCH_LENGTH,
    staleTime: 60_000,
  });
}
