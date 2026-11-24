import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelLadderMatch, correctLadderMatch, getLadder, getLadderEntrants, getLadderMatches, listLadders, removeLadder, restoreLadder } from "./api";
import type { LadderMatchFilter, LadderQuery } from "./types";

const root = ["admin", "ladders"] as const;

export const useLadders = (query: LadderQuery) => useQuery({ queryKey: [...root, "list", query], queryFn: () => listLadders(query), placeholderData: keepPreviousData });
export const useLadder = (id: string) => useQuery({ queryKey: [...root, "detail", id], queryFn: () => getLadder(id) });
export const useLadderEntrants = (id: string) => useQuery({ queryKey: [...root, "entrants", id], queryFn: () => getLadderEntrants(id) });
export const useLadderMatches = (id: string, status: LadderMatchFilter | undefined) =>
  useQuery({ queryKey: [...root, "matches", id, status ?? "all"], queryFn: () => getLadderMatches(id, status), placeholderData: keepPreviousData });

/** Every ladder action refreshes the ladder, the lists, the counts and the work queue. */
export function useLadderActions(id: string) {
  const client = useQueryClient();
  const refresh = () => {
    for (const key of [root, ["admin", "competitions"], ["admin", "queue"], ["admin", "disputes"]]) void client.invalidateQueries({ queryKey: key });
  };
  return {
    correct: (matchId: string, input: Parameters<typeof correctLadderMatch>[2]) => correctLadderMatch(id, matchId, input).then(refresh),
    cancel: (matchId: string, reason: string) => cancelLadderMatch(id, matchId, reason).then(refresh),
    remove: (reason: string) => removeLadder(id, reason).then(refresh),
    restore: () => restoreLadder(id).then(refresh),
  };
}
