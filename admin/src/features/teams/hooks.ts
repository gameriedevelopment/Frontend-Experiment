import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTeamDossier, listTeams } from "./api";
import type { TeamQuery } from "./types";

export const useTeams = (query: TeamQuery) =>
  useQuery({ queryKey: ["admin", "teams", "list", query], queryFn: () => listTeams(query), placeholderData: keepPreviousData });

export const useTeamDossier = (id: string) => useQuery({ queryKey: ["admin", "teams", "dossier", id], queryFn: () => getTeamDossier(id) });
