import { useQuery } from "@tanstack/react-query";
import { getNotificationUnreadCount } from "./api";

export function useNotificationUnreadCount(userId?: string) {
  return useQuery({
    queryKey: ["notifications", userId, "unread-count"],
    queryFn: () => getNotificationUnreadCount(userId!),
    enabled: Boolean(userId),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
}
