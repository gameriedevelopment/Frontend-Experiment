import { useQuery } from "@tanstack/react-query";
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

/** First page of a players or teams search, for pickers. Disabled until there is a term. */
export function useSearchResults<K extends SearchKind>(kind: K, term: string, enabled = true) {
  return useQuery({
    queryKey: ["unified-search", kind, term, "first-page"],
    queryFn: () => searchGamerie(kind, term),
    enabled: enabled && term.trim().length > 0,
    staleTime: 60_000,
  });
}
