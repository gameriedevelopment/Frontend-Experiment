import { useQuery } from "@tanstack/react-query";
import { getTotalUnread } from "./api";

export function useTotalUnread() {
  return useQuery({
    queryKey: ["total-unread-counts"],
    queryFn: getTotalUnread,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
