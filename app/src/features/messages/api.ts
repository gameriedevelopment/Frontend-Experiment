import { api, type ApiEnvelope } from "@/lib/api";
import type { CreateConversationPayload, MessageConversation } from "./types";

export async function getTotalUnread(): Promise<number> {
  const { data } = await api.get<ApiEnvelope<number>>("/messaging/unread/count");
  return Number(data.data ?? 0);
}

export async function createConversation(
  payload: CreateConversationPayload,
): Promise<MessageConversation> {
  const { data } = await api.post<ApiEnvelope<MessageConversation>>(
    "/messaging/conversations",
    payload,
  );
  return data.data;
}
