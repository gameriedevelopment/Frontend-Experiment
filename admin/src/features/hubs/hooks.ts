import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getHubDossier, listHubs } from "./api";
import type { HubQuery } from "./types";

export const useHubs = (query: HubQuery) => useQuery({ queryKey: ["admin", "hubs", "list", query], queryFn: () => listHubs(query), placeholderData: keepPreviousData });

export const useHubDossier = (id: string) => useQuery({ queryKey: ["admin", "hubs", "dossier", id], queryFn: () => getHubDossier(id) });
