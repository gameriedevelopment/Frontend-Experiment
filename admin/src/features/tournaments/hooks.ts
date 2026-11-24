import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelTournament, controlTournament, getTournament, getTournamentActivity, getTournamentEntrants, listTournaments, removeTournament, type TournamentControl } from "./api";
import type { TournamentQuery } from "./types";

const root = ["admin", "tournaments"] as const;

export const useTournaments = (query: TournamentQuery) =>
  useQuery({ queryKey: [...root, "list", query], queryFn: () => listTournaments(query), placeholderData: keepPreviousData });

export const useTournament = (id: string) => useQuery({ queryKey: [...root, "detail", id], queryFn: () => getTournament(id) });
export const useTournamentEntrants = (id: string) => useQuery({ queryKey: [...root, "entrants", id], queryFn: () => getTournamentEntrants(id) });
export const useTournamentActivity = (id: string) => useQuery({ queryKey: [...root, "activity", id], queryFn: () => getTournamentActivity(id) });

/** Pause, resume, cancel and remove; the tournament, the lists and the counts refresh after each. */
export function useTournamentActions(id: string) {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: root });
    void client.invalidateQueries({ queryKey: ["admin", "competitions"] });
    void client.invalidateQueries({ queryKey: ["admin", "overview"] });
  };
  return {
    control: useMutation({ mutationFn: (action: TournamentControl) => controlTournament(id, action), onSuccess: refresh }),
    cancel: (reason: string) => cancelTournament(id, reason).then(refresh),
    remove: (reason: string) => removeTournament(id, reason).then(refresh),
  };
}
