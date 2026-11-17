import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/authStore";
import { connectMessagingSocket, disconnectMessagingSocket } from "./api";
import { markSentSeen, patchMessage, removeMessage, touchConversation, upsertMessage } from "./realtimeCache";
import type { ChatMessage } from "./types";

interface MessageEvent {
  eventId?: string;
  type?: string;
  conversationId?: string;
  actorId?: string;
  messageId?: string;
  message?: ChatMessage;
}

/**
 * One socket for the signed-in session. Message events update the caches in place (no refetch per
 * message); anything not cached yet falls back to a refetch. Events arrive on both the conversation and
 * user rooms, so each is applied once by its eventId.
 */
export function RealtimeBridge() {
  const client = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!user?.id) {
      disconnectMessagingSocket();
      return;
    }
    const socket = connectMessagingSocket();
    const seen = new Set<string>();
    const once = (event: MessageEvent, name: string) => {
      const id = event.eventId ? `${event.eventId}` : `${name}:${event.messageId}:${event.conversationId}`;
      if (seen.has(id)) return false;
      seen.add(id);
      if (seen.size > 500) seen.delete(seen.values().next().value as string);
      return true;
    };
    const refreshCounts = (conversationId?: string) => {
      void client.invalidateQueries({ queryKey: ["total-unread-counts"] });
      if (conversationId) void client.invalidateQueries({ queryKey: ["unread-counts", conversationId] });
    };

    const onMessage = (event: MessageEvent = {}) => {
      if (!event.conversationId || !once(event, "message")) return;
      const message = event.message ? { ...event.message, conversationId: event.conversationId, timestamp: event.message.timestamp || event.message.createdAt || new Date().toISOString() } : null;
      if (message) {
        upsertMessage(client, event.conversationId, message);
        if (!touchConversation(client, event.conversationId, message, user.id)) void client.invalidateQueries({ queryKey: ["conversations"] });
      } else {
        void client.invalidateQueries({ queryKey: ["messages", event.conversationId] });
        void client.invalidateQueries({ queryKey: ["conversations"] });
      }
      refreshCounts(event.conversationId);
    };
    const onEdited = (event: MessageEvent = {}) => {
      if (!event.conversationId || !event.messageId || !once(event, "edited")) return;
      if (event.message?.content !== undefined) patchMessage(client, event.conversationId, event.messageId, { content: event.message.content });
      else void client.invalidateQueries({ queryKey: ["messages", event.conversationId] });
    };
    const onDeleted = (event: MessageEvent = {}) => {
      if (!event.conversationId || !event.messageId || !once(event, "deleted")) return;
      removeMessage(client, event.conversationId, event.messageId);
      void client.invalidateQueries({ queryKey: ["conversations"] });
    };
    const onRead = (event: MessageEvent = {}) => {
      if (!event.conversationId || !once(event, "read")) return;
      if (event.actorId && event.actorId !== user.id) markSentSeen(client, event.conversationId, user.id);
      else refreshCounts(event.conversationId);
    };
    const onNotification = (payload?: { message?: string }) => {
      void client.invalidateQueries({ queryKey: ["notifications"] });
      void client.invalidateQueries({ queryKey: ["teams", "invites", "mine"] });
      void client.invalidateQueries({ queryKey: ["hubs", "invites", "mine"] });
      void client.invalidateQueries({ queryKey: ["team-operations"] });
      void client.invalidateQueries({ queryKey: ["hub-operations"] });
      if (payload?.message) setAnnouncement(payload.message);
    };
    const onReconnect = () => {
      // Anything missed while offline is fetched once on the way back.
      void client.invalidateQueries({ queryKey: ["conversations"] });
      void client.invalidateQueries({ queryKey: ["messages"] });
      refreshCounts();
    };

    socket.on("message.created", onMessage);
    socket.on("message.sent", onMessage);
    socket.on("message.edited", onEdited);
    socket.on("message.deleted", onDeleted);
    socket.on("conversation.read", onRead);
    socket.on("notification.created", onNotification);
    socket.io.on("reconnect", onReconnect);
    return () => {
      socket.off("message.created", onMessage);
      socket.off("message.sent", onMessage);
      socket.off("message.edited", onEdited);
      socket.off("message.deleted", onDeleted);
      socket.off("conversation.read", onRead);
      socket.off("notification.created", onNotification);
      socket.io.off("reconnect", onReconnect);
    };
  }, [client, user?.id]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
}
