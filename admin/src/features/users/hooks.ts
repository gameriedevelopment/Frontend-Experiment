import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getUserDossier, listUsers } from "./api";
import type { UserQuery } from "./types";

export const userKeys = {
  list: (query: UserQuery) => ["admin", "users", "list", query] as const,
  dossier: (id: string) => ["admin", "users", "dossier", id] as const,
};

export const useUsers = (query: UserQuery) => useQuery({ queryKey: userKeys.list(query), queryFn: () => listUsers(query), placeholderData: keepPreviousData });

export const useUserDossier = (id: string) => useQuery({ queryKey: userKeys.dossier(id), queryFn: () => getUserDossier(id) });
