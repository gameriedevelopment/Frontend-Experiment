import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getGame, getGameSummary, listGames } from "./api";
import type { GameQuery } from "./types";

export const gameKeys = {
  all: ["admin", "games"] as const,
  list: (query: GameQuery) => ["admin", "games", "list", query] as const,
  detail: (id: string) => ["admin", "games", "detail", id] as const,
  summary: ["admin", "games", "summary"] as const,
};

export const useGames = (query: GameQuery) => useQuery({ queryKey: gameKeys.list(query), queryFn: () => listGames(query), placeholderData: keepPreviousData });
export const useGame = (id: string | undefined) => useQuery({ queryKey: gameKeys.detail(id ?? ""), queryFn: () => getGame(id!), enabled: Boolean(id) });
export const useGameSummary = () => useQuery({ queryKey: gameKeys.summary, queryFn: getGameSummary, staleTime: 60_000 });
