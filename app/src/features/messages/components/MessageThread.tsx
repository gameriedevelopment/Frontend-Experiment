import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmojiButton } from "@/components/ui/EmojiButton";
import { Icon } from "@/components/ui/Icon";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/features/auth/authStore";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { insertAtCursor } from "@/lib/insertAtCursor";
import { toast } from "@/lib/toast";
import { conversationImage, conversationTitle, dayLabel, messageTime, otherParticipant, parseQuote } from "../format";
import {
  useConversationRealtime,
  useDeleteConversation,
  useDeleteMessage,
  useEditMessage,
  useMarkConversationRead,
  useMessageTeam,
  useRealtimeStatus,
  useSendMessage,
} from "../hooks";
import { connectMessagingSocket } from "../api";
import { createQuotedReply } from "../messageQuote";
import { setOpenConversation } from "../realtimeCache";
import type { ChatMessage, MessageConversation } from "../types";

const GROUP_GAP_MS = 5 * 60 * 1000;
const LEAD_ROLES = ["owner", "leader", "vice leader", "deputy leader", "manager"];

/** Plain text with links made clickable; message content isn't rendered as markdown. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<>"']+)/g);
  return (
    <>
      {parts.map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="underline decoration-current/40 underline-offset-2 hover:decoration-current">
            {part}
          </a>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Bubble({
  message,
  own,
  showAuthor,
  last,
  team,
  seen,
  onReply,
  onEdit,
  onDelete,
}: {
  message: ChatMessage;
  own: boolean;
  showAuthor: boolean;
  last: boolean;
  team: boolean;
  seen?: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pending = message.id.startsWith("pending-");
  const quote = parseQuote(message.content);
  const time = messageTime(message);

  if (message.isAnnouncement)
    return (
      <div className="my-3 rounded-2xl bg-lavender-400/8 p-4 ring-1 ring-inset ring-lavender-400/30">
        <p className="type-label flex items-center gap-2 text-lavender-300">
          <Icon name="megaphone" className="size-3.5" />
          Announcement · {message.senderName || "Team"}
        </p>
        <p className="mt-2 whitespace-pre-wrap break-words text-[0.95rem] text-mist-50">
          <Linkified text={quote?.body ?? message.content} />
        </p>
        {time && <p className="mt-2 text-xs text-mist-500">{new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(time))}</p>}
      </div>
    );

  return (
    <div className={cn("group flex flex-col", own ? "items-end" : "items-start", showAuthor && "mt-3")}>
      {showAuthor && !own && team && <span className="mb-1 ml-3 text-xs font-medium text-mist-400">{message.senderName || "Player"}</span>}
      <div className={cn("flex max-w-[min(32rem,85%)] items-center gap-1.5", own && "flex-row-reverse")}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "min-w-0 rounded-[1.25rem] px-3.5 py-2 text-left text-[0.95rem] leading-relaxed transition-opacity",
            own ? "rounded-br-md bg-lavender-400 text-ink-950" : "rounded-bl-md bg-white/7 text-mist-50",
            pending && "opacity-60",
          )}
        >
          {quote && (
            <span className={cn("mb-1.5 block rounded-lg border-l-2 px-2.5 py-1 text-xs", own ? "border-ink-950/40 bg-ink-950/10" : "border-lavender-400/60 bg-white/5")}>
              <span className="block font-semibold">{quote.name}</span>
              <span className="line-clamp-2 opacity-80">{quote.excerpt}</span>
            </span>
          )}
          <span className="whitespace-pre-wrap break-words">
            <Linkified text={quote?.body ?? message.content} />
          </span>
        </button>
        {!pending && (
          <span className={cn("flex shrink-0 items-center gap-0.5 transition-opacity", open ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")}>
            <ActionButton label="Reply" icon="reply" onClick={onReply} />
            {own && <ActionButton label="Edit" icon="edit" onClick={onEdit} />}
            {own && <ActionButton label="Delete" icon="trash" onClick={onDelete} danger />}
          </span>
        )}
      </div>
      {(last || pending || seen) && time && (
        <span className="mx-3 mt-1 text-[0.7rem] text-mist-500">
          {pending ? "Sending…" : `${seen ? "Seen · " : ""}${new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(time))}`}
        </span>
      )}
    </div>
  );
}

function ActionButton({ label, icon, onClick, danger }: { label: string; icon: "reply" | "edit" | "trash"; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("grid size-7 place-items-center rounded-full text-mist-500 transition-colors hover:bg-white/8", danger ? "hover:text-danger" : "hover:text-mist-100")}
    >
      <Icon name={icon} className="size-3.5" />
    </button>
  );
}

function Composer({
  onSend,
  onTyping,
  context,
  onCancelContext,
  canAnnounce,
  initial,
  disabled,
}: {
  onSend: (content: string, announcement: boolean) => Promise<void>;
  onTyping: () => void;
  context: ReactNode;
  onCancelContext: () => void;
  canAnnounce: boolean;
  initial: string;
  disabled?: boolean;
}) {
  const [content, setContent] = useState(initial);
  const [announcement, setAnnouncement] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(initial);
    if (context) requestAnimationFrame(() => ref.current?.focus());
  }, [initial, context]);

  const submit = async () => {
    const clean = content.trim();
    if (!clean || disabled) return;
    setContent("");
    try {
      await onSend(clean, announcement);
      setAnnouncement(false);
    } catch (error) {
      setContent(clean);
      toast.error("Message not sent", getApiErrorMessage(error, "Check your connection and try again."));
    }
  };

  return (
    <div className="border-t border-white/6 p-3 sm:p-4">
      {context && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/4 px-3 py-2 text-xs text-mist-300">
          <span className="min-w-0 flex-1 truncate">{context}</span>
          <button type="button" aria-label="Cancel" onClick={onCancelContext} className="grid size-6 place-items-center rounded-full text-mist-400 hover:bg-white/8 hover:text-mist-50">
            <Icon name="close" className="size-3.5" />
          </button>
        </div>
      )}
      <div className={cn("flex items-end gap-2 rounded-[1.4rem] bg-white/5 p-1.5 pl-4 ring-1 ring-inset transition-colors", announcement ? "ring-lavender-400/60" : "ring-white/10 focus-within:ring-lavender-400/50")}>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Message</span>
          <textarea
            ref={ref}
            rows={1}
            value={content}
            maxLength={4000}
            onChange={(event) => {
              setContent(event.target.value);
              if (event.target.value.trim()) onTyping();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                void submit();
              }
              if (event.key === "Escape" && context) onCancelContext();
            }}
            placeholder={announcement ? "Write an announcement for the team" : "Write a message"}
            className="field-sizing-content block max-h-40 min-h-9 w-full resize-none bg-transparent py-1.5 text-[0.95rem] outline-none pointer-coarse:text-base placeholder:text-mist-500"
          />
        </label>
        <EmojiButton onPick={(emoji) => setContent((current) => insertAtCursor(ref.current, current, emoji, 4000))} />
        {canAnnounce && (
          <button
            type="button"
            aria-pressed={announcement}
            title="Send as a team announcement"
            onClick={() => setAnnouncement((value) => !value)}
            className={cn("grid size-9 shrink-0 place-items-center rounded-full transition-colors", announcement ? "bg-lavender-400/18 text-lavender-200" : "text-mist-400 hover:bg-white/6 hover:text-mist-100")}
          >
            <Icon name="megaphone" className="size-4" />
          </button>
        )}
        <button
          type="button"
          aria-label="Send"
          disabled={!content.trim() || disabled}
          onClick={() => void submit()}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-lavender-400 text-ink-950 transition-opacity disabled:opacity-30"
        >
          <Icon name="send" weight="fill" className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function MessageThread({
  conversation,
  messages,
  loading,
  unread,
  hasOlder,
  fetchingOlder,
  onLoadOlder,
  onBack,
}: {
  conversation: MessageConversation;
  messages: ChatMessage[];
  loading: boolean;
  unread: number;
  hasOlder: boolean;
  fetchingOlder: boolean;
  onLoadOlder: () => Promise<unknown>;
  onBack: () => void;
}) {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const status = useRealtimeStatus();
  const [showStatus, setShowStatus] = useState(false);
  const send = useSendMessage(conversation.id, user);
  const edit = useEditMessage(conversation.id);
  const remove = useDeleteMessage(conversation.id);
  const read = useMarkConversationRead(conversation.type === "user" ? "user" : "team");
  const removeConversation = useDeleteConversation();
  const teamQuery = useMessageTeam(conversation.type !== "user" ? conversation.team?.id : undefined);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [deleting, setDeleting] = useState<ChatMessage | null>(null);
  const [leaving, setLeaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const opened = useRef<string | null>(null);
  const [typing, setTyping] = useState<Record<string, number>>({});
  const typingSent = useRef(0);
  const typingStop = useRef<number | undefined>(undefined);
  useConversationRealtime(conversation.id);

  useEffect(() => {
    setOpenConversation(conversation.id);
    return () => setOpenConversation(null);
  }, [conversation.id]);

  // Others typing in this thread; each signal lasts 6s unless renewed or their message lands.
  useEffect(() => {
    const socket = connectMessagingSocket();
    const started = (event: { conversationId?: string; userId?: string }) => {
      if (event.conversationId !== conversation.id || !event.userId || event.userId === user?.id) return;
      setTyping((current) => ({ ...current, [event.userId!]: Date.now() + 6000 }));
    };
    const stopped = (event: { conversationId?: string; userId?: string }) => {
      if (event.conversationId !== conversation.id || !event.userId) return;
      setTyping((current) => {
        if (!(event.userId! in current)) return current;
        const next = { ...current };
        delete next[event.userId!];
        return next;
      });
    };
    socket.on("typing.started", started);
    socket.on("typing.stopped", stopped);
    const sweep = window.setInterval(() => {
      setTyping((current) => {
        const now = Date.now();
        const live = Object.entries(current).filter(([, until]) => until > now);
        return live.length === Object.keys(current).length ? current : Object.fromEntries(live);
      });
    }, 2000);
    return () => {
      socket.off("typing.started", started);
      socket.off("typing.stopped", stopped);
      window.clearInterval(sweep);
      setTyping({});
    };
  }, [conversation.id, user?.id]);

  const stopTyping = () => {
    window.clearTimeout(typingStop.current);
    if (typingSent.current) connectMessagingSocket().emit("typing.stopped", { conversationId: conversation.id });
    typingSent.current = 0;
  };
  const notifyTyping = () => {
    const now = Date.now();
    if (now - typingSent.current > 3000) {
      connectMessagingSocket().emit("typing.started", { conversationId: conversation.id });
      typingSent.current = now;
    }
    window.clearTimeout(typingStop.current);
    typingStop.current = window.setTimeout(stopTyping, 4000);
  };
  useEffect(() => () => window.clearTimeout(typingStop.current), []);

  const title = conversationTitle(conversation, user?.id);
  const other = conversation.type === "user" ? otherParticipant(conversation, user?.id) : null;
  const team = teamQuery.data ?? conversation.team;
  const membership = team?.members?.find((member) => member.user?.id === user?.id || member.userId === user?.id);
  const roleText = `${membership?.role ?? ""} ${membership?.title ?? ""}`.toLowerCase();
  const canAnnounce = conversation.type === "team" && LEAD_ROLES.some((role) => roleText.includes(role));

  useEffect(() => {
    setReplyTo(null);
    setEditing(null);
  }, [conversation.id]);

  // Only mention the connection when it has been down for a moment, not during the first connect.
  useEffect(() => {
    if (status === "online") return setShowStatus(false);
    const timer = window.setTimeout(() => setShowStatus(true), 3000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const { mutate: markRead, isPending: marking } = read;
  useEffect(() => {
    if (unread > 0 && !marking) markRead(conversation.id);
  }, [conversation.id, markRead, marking, unread]);

  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node || loading) return;
    if (opened.current !== conversation.id) {
      opened.current = conversation.id;
      node.scrollTop = node.scrollHeight;
      return;
    }
    if (!fetchingOlder && node.scrollHeight - node.scrollTop - node.clientHeight < 200) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [conversation.id, loading, messages.length, fetchingOlder]);

  const loadOlder = async () => {
    const node = scrollRef.current;
    if (!node || !hasOlder || fetchingOlder) return;
    const height = node.scrollHeight;
    const top = node.scrollTop;
    await onLoadOlder();
    requestAnimationFrame(() => {
      node.scrollTop = top + node.scrollHeight - height;
    });
  };

  const rows = useMemo(
    () =>
      messages.map((message, index) => {
        const previous = messages[index - 1];
        const next = messages[index + 1];
        const time = new Date(messageTime(message)).getTime();
        const newDay = !previous || new Date(messageTime(previous)).toDateString() !== new Date(messageTime(message)).toDateString();
        const startsGroup = newDay || !previous || previous.senderId !== message.senderId || time - new Date(messageTime(previous)).getTime() > GROUP_GAP_MS || Boolean(previous.isAnnouncement);
        const endsGroup = !next || next.senderId !== message.senderId || new Date(messageTime(next)).getTime() - time > GROUP_GAP_MS || Boolean(next.isAnnouncement);
        return { message, newDay, startsGroup, endsGroup };
      }),
    [messages],
  );

  const latest = messages[messages.length - 1];
  useEffect(() => {
    if (!latest?.senderId) return;
    setTyping((current) => {
      if (!(latest.senderId in current)) return current;
      const next = { ...current };
      delete next[latest.senderId];
      return next;
    });
  }, [latest?.id, latest?.senderId]);

  const typers = Object.keys(typing).map((id) =>
    conversation.type === "user"
      ? (other?.displayName || other?.username || "They")
      : team?.members?.find((member) => member.user?.id === id || member.userId === id)?.user?.username ?? "Someone",
  );
  const typingText = typers.length === 1 ? `${typers[0]} is typing` : typers.length === 2 ? `${typers[0]} and ${typers[1]} are typing` : typers.length ? "Several people are typing" : "";
  const lastOwn = [...messages].reverse().find((message) => message.senderId === user?.id && !message.id.startsWith("pending-"));
  const seenId = conversation.type === "user" && lastOwn?.isSeen ? lastOwn.id : null;

  const menu: MenuItem[] = [
    ...(other?.username ? [{ label: "View profile", icon: "people" as const, onSelect: () => navigate(`/profile/${encodeURIComponent(other.username!)}`) }] : []),
    ...(team?.id ? [{ label: "View team", icon: "team" as const, onSelect: () => navigate(`/teams/${encodeURIComponent(team.id)}`) }] : []),
    ...(conversation.type !== "team" ? [{ label: "Delete conversation", icon: "trash" as const, danger: true, onSelect: () => setLeaving(true) }] : []),
  ];

  const send_ = async (content: string, announcement: boolean) => {
    stopTyping();
    if (editing) {
      await edit.mutateAsync({ messageId: editing.id, content });
      setEditing(null);
      return;
    }
    const body = replyTo ? createQuotedReply(replyTo, content) : content;
    setReplyTo(null);
    await send.mutateAsync({ content: body, isAnnouncement: canAnnounce && announcement });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-white/6 px-3 py-3 sm:px-5">
        <button type="button" aria-label="Back to conversations" onClick={onBack} className="grid size-9 place-items-center rounded-full text-mist-300 hover:bg-white/6 lg:hidden">
          <Icon name="arrowLeft" className="size-5" />
        </button>
        <Link to={other?.username ? `/profile/${encodeURIComponent(other.username)}` : team?.id ? `/teams/${encodeURIComponent(team.id)}` : "#"} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar src={conversationImage(conversation, user?.id)} name={title} online={other?.isOnline} tone={conversation.type === "user" ? "brand" : "ink"} className={conversation.type === "user" ? "rounded-full" : "rounded-xl"} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{title}</span>
            <span className="block truncate text-xs text-mist-500">
              {conversation.type === "user"
                ? other?.isOnline
                  ? "Online"
                  : other?.gamerTitle || "Player"
                : conversation.type === "team-inbox"
                  ? "Team inbox · the team's leads reply here"
                  : `Team chat${team?.members?.length ? ` · ${team.members.length} members` : ""}`}
            </span>
          </span>
        </Link>
        {showStatus && status !== "online" && (
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-mist-400">
            <span className={cn("size-1.5 rounded-full", status === "offline" ? "bg-danger" : "animate-pulse bg-mist-400")} />
            {status === "offline" ? "Reconnecting" : "Connecting"}
          </span>
        )}
        {menu.length > 0 && <Menu label="Conversation options" items={menu} />}
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 scrollbar-thin scrollbar-thumb-white/12 scrollbar-track-transparent sm:px-6">
        {loading ? (
          <div aria-hidden="true" className="grid gap-3">
            <Skeleton className="h-10 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-10 w-1/2 rounded-2xl" />
            <Skeleton className="h-16 w-3/5 rounded-2xl" />
          </div>
        ) : messages.length ? (
          <div className="flex flex-col">
            {hasOlder && (
              <button type="button" onClick={() => void loadOlder()} disabled={fetchingOlder} className="mx-auto mb-4 rounded-full px-3 py-1.5 text-xs font-medium text-mist-400 ring-1 ring-inset ring-white/10 hover:text-mist-100">
                {fetchingOlder ? "Loading…" : "Load earlier messages"}
              </button>
            )}
            {rows.map(({ message, newDay, startsGroup, endsGroup }) => (
              <Fragment key={message.id}>
                {newDay && (
                  <p className="type-label my-4 text-center text-mist-500">{dayLabel(messageTime(message))}</p>
                )}
                <div className={cn("flex gap-2", startsGroup ? "mt-2" : "mt-0.5")}>
                  {conversation.type !== "user" && message.senderId !== user?.id && (
                    <span className="w-8 shrink-0 self-end">
                      {endsGroup && !message.isAnnouncement && <Avatar src={message.senderAvatar ?? undefined} name={message.senderName ?? "Player"} size="sm" className="rounded-full" />}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <Bubble
                      message={message}
                      own={message.senderId === user?.id}
                      showAuthor={startsGroup}
                      last={endsGroup}
                      team={conversation.type !== "user"}
                      seen={message.id === seenId}
                      onReply={() => {
                        setEditing(null);
                        setReplyTo(message);
                      }}
                      onEdit={() => {
                        setReplyTo(null);
                        setEditing(message);
                      }}
                      onDelete={() => setDeleting(message)}
                    />
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="grid h-full place-items-center">
            <div className="grid justify-items-center gap-3 text-center">
              <Avatar src={conversationImage(conversation, user?.id)} name={title} size="lg" tone={conversation.type === "user" ? "brand" : "ink"} className={conversation.type === "user" ? "rounded-full" : "rounded-2xl"} />
              <p className="font-semibold">{title}</p>
              <p className="max-w-64 text-sm text-mist-500">{conversation.type === "user" ? "Say hello. Scrim times, challenges, GGs: it all starts here." : "Start the conversation with your team."}</p>
            </div>
          </div>
        )}
      </div>

      <div aria-live="polite" className={cn("h-5 px-5 text-xs text-mist-400 transition-opacity", typingText ? "opacity-100" : "opacity-0")}>
        {typingText && (
          <span className="flex items-center gap-2">
            <span className="flex gap-0.5" aria-hidden="true">
              {[0, 1, 2].map((dot) => (
                <span key={dot} className="size-1 animate-bounce rounded-full bg-lavender-300 motion-reduce:animate-none" style={{ animationDelay: `${dot * 120}ms` }} />
              ))}
            </span>
            {typingText}…
          </span>
        )}
      </div>
      <Composer
        onSend={send_}
        onTyping={notifyTyping}
        canAnnounce={canAnnounce && !editing}
        initial={editing ? (parseQuote(editing.content)?.body ?? editing.content) : ""}
        disabled={send.isPending && !editing}
        context={editing ? "Editing your message" : replyTo ? `Replying to ${replyTo.senderId === user?.id ? "yourself" : replyTo.senderName || "Player"}` : null}
        onCancelContext={() => {
          setEditing(null);
          setReplyTo(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this message?"
        description="It's removed for everyone in the conversation."
        confirmLabel="Delete"
        icon="trash"
        pending={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
            onError: (error) => toast.error("Couldn't delete the message", getApiErrorMessage(error, "Try again in a moment.")),
          })
        }
        onClose={() => setDeleting(null)}
      />
      <ConfirmDialog
        open={leaving}
        title="Delete this conversation?"
        description="It's removed from your messages. The other side keeps their copy."
        confirmLabel="Delete"
        icon="trash"
        pending={removeConversation.isPending}
        onConfirm={() =>
          removeConversation.mutate(conversation.id, {
            onSuccess: () => {
              setLeaving(false);
              onBack();
              toast.info("Conversation deleted");
            },
            onError: (error) => toast.error("Couldn't delete the conversation", getApiErrorMessage(error, "Try again in a moment.")),
          })
        }
        onClose={() => setLeaving(false)}
      />
    </div>
  );
}
