export type ConversationKind = "user" | "team";

export interface CreateConversationPayload {
  participantIds: string[];
  type: ConversationKind;
  name?: string;
  avatar?: string;
  teamId?: string;
}

export interface MessageConversation {
  id: string;
  type: ConversationKind;
  name?: string;
  avatar?: string | null;
}
