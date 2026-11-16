import { api, type ApiEnvelope } from "@/lib/api";

export async function getTotalUnread(): Promise<number> {
  const { data } = await api.get<ApiEnvelope<number>>("/messaging/unread/count");
  return Number(data.data ?? 0);
}
