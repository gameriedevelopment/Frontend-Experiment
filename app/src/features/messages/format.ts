import { messageExcerpt } from "./messageQuote";
import type { ChatMessage, MessageConversation, MessageUser } from "./types";

export const userName = (user?: MessageUser | null) => user?.displayName || user?.username || "Player";

export function otherParticipant(conversation: MessageConversation, meId?: string) {
  return conversation.participants.find((participant) => participant.id !== meId) ?? conversation.participants[0];
}

export function conversationTitle(conversation: MessageConversation, meId?: string) {
  if (conversation.type === "user") return userName(otherParticipant(conversation, meId));
  return conversation.team?.name || conversation.name || "Team";
}

export function conversationImage(conversation: MessageConversation, meId?: string) {
  if (conversation.type === "user") {
    const other = otherParticipant(conversation, meId);
    return other?.profileImage || other?.profilePictureUrl || undefined;
  }
  return conversation.team?.logo || conversation.avatar || undefined;
}

export function lastMessageOf(conversation: MessageConversation, meId?: string) {
  const last = conversation.lastMessage;
  if (!last) return null;
  if (typeof last === "string") return messageExcerpt(last, 90);
  const prefix = last.senderId === meId ? "You: " : conversation.type !== "user" && last.senderName ? `${last.senderName}: ` : "";
  return `${prefix}${messageExcerpt(last.content, 90)}`;
}

export const messageTime = (message: ChatMessage) => message.timestamp || message.createdAt || "";

/** Today shows the time, this week the weekday, older the date. */
export function listTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86_400_000);
  if (days <= 0) return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  if (days === 1) return "Yesterday";
  if (days < 7) return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export function dayLabel(value: string) {
  const date = new Date(value);
  const days = Math.floor((new Date(new Date().toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric", year: days > 300 ? "numeric" : undefined }).format(date);
}

/** Replies are stored as "> **Name:** excerpt" followed by the response; this splits them back apart. */
export function parseQuote(content: string) {
  const match = content.match(/^> \*\*(.+?):\*\* (.*)\n\n([\s\S]*)$/);
  return match ? { name: match[1], excerpt: match[2], body: match[3] } : null;
}
