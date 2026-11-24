import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { decide, listDisputes } from "./api";
import type { DecisionInput, Dispute } from "./types";

export const useDisputes = () => useQuery({ queryKey: ["admin", "disputes"], queryFn: listDisputes, refetchInterval: 60_000 });

export function useDecision() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ dispute, input }: { dispute: Dispute; input: DecisionInput }) => decide(dispute, input),
    onSuccess: () => {
      for (const key of [["admin", "disputes"], ["admin", "queue"], ["admin", "tournaments"], ["admin", "ladders"], ["admin", "leagues"], ["admin", "overview"]]) {
        void client.invalidateQueries({ queryKey: key });
      }
    },
  });
}
