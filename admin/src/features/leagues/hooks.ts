import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelFixture, controlSeason, correctFixture, getLeague, getSeasonFixtures, listLeagues, removeLeague, restoreLeague } from "./api";
import type { LeagueQuery, SeasonControl } from "./types";

const root = ["admin", "leagues"] as const;

export const useLeagues = (query: LeagueQuery) => useQuery({ queryKey: [...root, "list", query], queryFn: () => listLeagues(query), placeholderData: keepPreviousData });
export const useLeague = (id: string) => useQuery({ queryKey: [...root, "detail", id], queryFn: () => getLeague(id) });
export const useSeasonFixtures = (id: string, seasonId: string | null | undefined, status?: string) =>
  useQuery({
    queryKey: [...root, "fixtures", id, seasonId, status ?? "all"],
    queryFn: () => getSeasonFixtures(id, seasonId!, status),
    enabled: Boolean(seasonId),
    placeholderData: keepPreviousData,
  });

export function useLeagueActions(id: string) {
  const client = useQueryClient();
  const refresh = () => {
    for (const key of [root, ["admin", "competitions"], ["admin", "queue"], ["admin", "disputes"]]) void client.invalidateQueries({ queryKey: key });
  };
  return {
    control: (seasonId: string, action: SeasonControl, reason: string) => controlSeason(id, seasonId, action, reason).then(refresh),
    correct: (fixtureId: string, scoreA: number, scoreB: number, reason: string) => correctFixture(fixtureId, { scoreA, scoreB, reason }).then(refresh),
    cancel: (fixtureId: string, reason: string) => cancelFixture(fixtureId, reason).then(refresh),
    remove: (reason: string) => removeLeague(id, reason).then(refresh),
    restore: () => restoreLeague(id).then(refresh),
  };
}
