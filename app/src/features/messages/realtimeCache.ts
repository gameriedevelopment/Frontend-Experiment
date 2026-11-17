import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { ChatMessage, ConversationsPage, MessageConversation, MessagesPage } from "./types";

type Pages = InfiniteData<MessagesPage>;
type ConversationPages = InfiniteData<ConversationsPage>;

let openConversation: string | null = null;
/** The thread on screen; its messages don't count as unread. */
export const setOpenConversation = (id: string | null) => {
  openConversation = id;
};

const key = (conversationId: string) => ["messages", conversationId];

/** Adds or updates a message in a cached thread (pages are newest first), confirming its optimistic copy. */
export function upsertMessage(client: QueryClient, conversationId: string, message: ChatMessage) {
  client.setQueryData<Pages>(key(conversationId), (data) => {
    if (!data?.pages.length) return data;
    if (data.pages.some((page) => page.data.some((item) => item.id === message.id)))
      return { ...data, pages: data.pages.map((page) => ({ ...page, data: page.data.map((item) => (item.id === message.id ? { ...item, ...message } : item)) })) };
    const [first, ...rest] = data.pages;
    const pending = first.data.findIndex((item) => item.id.startsWith("pending-") && item.senderId === message.senderId && item.content === message.content);
    const kept = pending >= 0 ? first.data.filter((_, index) => index !== pending) : first.data;
    return { ...data, pages: [{ ...first, data: [message, ...kept] }, ...rest] };
  });
}

export function patchMessage(client: QueryClient, conversationId: string, messageId: string, patch: Partial<ChatMessage>) {
  client.setQueryData<Pages>(key(conversationId), (data) =>
    data ? { ...data, pages: data.pages.map((page) => ({ ...page, data: page.data.map((item) => (item.id === messageId ? { ...item, ...patch } : item)) })) } : data,
  );
}

export function removeMessage(client: QueryClient, conversationId: string, messageId: string) {
  client.setQueryData<Pages>(key(conversationId), (data) =>
    data ? { ...data, pages: data.pages.map((page) => ({ ...page, data: page.data.filter((item) => item.id !== messageId) })) } : data,
  );
}

/** The other side read the thread: everything we sent before now is seen. */
export function markSentSeen(client: QueryClient, conversationId: string, meId: string) {
  client.setQueryData<Pages>(key(conversationId), (data) =>
    data ? { ...data, pages: data.pages.map((page) => ({ ...page, data: page.data.map((item) => (item.senderId === meId && !item.isSeen ? { ...item, isSeen: true } : item)) })) } : data,
  );
}

/** Moves the conversation to the top with its latest message. Returns false when it isn't cached yet. */
export function touchConversation(client: QueryClient, conversationId: string, message: ChatMessage, meId?: string) {
  let found = false;
  client.getQueriesData<ConversationPages>({ queryKey: ["conversations"] }).forEach(([queryKey, data]) => {
    if (!data?.pages?.length) return;
    let match: MessageConversation | undefined;
    const pages = data.pages.map((page) => ({
      ...page,
      data: page.data.filter((conversation) => {
        if (conversation.id !== conversationId) return true;
        match = conversation;
        return false;
      }),
    }));
    if (!match) return;
    found = true;
    const incoming = message.senderId !== meId && openConversation !== conversationId;
    const updated: MessageConversation = {
      ...match,
      lastMessage: message,
      lastMessageTime: message.timestamp || message.createdAt || new Date().toISOString(),
      unreadCount: incoming ? Number(match.unreadCount ?? 0) + 1 : match.unreadCount,
    };
    pages[0] = { ...pages[0], data: [updated, ...pages[0].data] };
    client.setQueryData(queryKey, { ...data, pages });
  });
  return found;
}
