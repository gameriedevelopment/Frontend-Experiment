import { api, type ApiEnvelope } from "@/lib/api";

export async function getNotificationUnreadCount(userId: string): Promise<number> {
  const { data } = await api.get<ApiEnvelope<number>>(`/notifications/${userId}/unread-count`);
  return data.data;
}
