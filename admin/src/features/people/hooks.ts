import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteRecord, getPeopleSummary, searchEverything, setBan, type ModeratedKind } from "./api";

export const peopleKeys = {
  all: ["admin", "people"] as const,
  summary: ["admin", "people", "summary"] as const,
  search: (q: string) => ["admin", "search", q] as const,
};

export const usePeopleSummary = () => useQuery({ queryKey: peopleKeys.summary, queryFn: getPeopleSummary, staleTime: 60_000 });

export const useSearch = (q: string) =>
  useQuery({ queryKey: peopleKeys.search(q), queryFn: () => searchEverything(q), enabled: q.trim().length >= 2, placeholderData: keepPreviousData, staleTime: 30_000 });

/** Ban, lift and delete for any user, team or hub; every list and dossier refreshes after. */
export function useModeration(kind: ModeratedKind, id: string) {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: peopleKeys.all });
    void client.invalidateQueries({ queryKey: ["admin", kind] });
  };
  return {
    ban: useMutation({ mutationFn: ({ ban, reason }: { ban: boolean; reason: string }) => setBan(kind, id, ban, reason), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (reason: string) => deleteRecord(kind, id, reason), onSuccess: refresh }),
  };
}
