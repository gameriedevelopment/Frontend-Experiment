import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createConversation, getTotalUnread } from "./api";
import type { CreateConversationPayload } from "./types";

export function useTotalUnread() {
  return useQuery({
    queryKey: ["total-unread-counts"],
    queryFn: getTotalUnread,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useCreateConversation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateConversationPayload) => createConversation(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ["conversations"] }),
  });
}
