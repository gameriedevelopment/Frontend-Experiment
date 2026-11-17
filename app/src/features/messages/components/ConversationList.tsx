import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { conversationImage, conversationTitle, lastMessageOf, listTime, otherParticipant } from "../format";
import type { MessageConversation } from "../types";

type Tab = "user" | "team";

export function ConversationList({
  tab,
  onTab,
  conversations,
  loading,
  selectedId,
  onSelect,
  meId,
  search,
  onSearch,
  onNew,
  hasMore,
  onMore,
  loadingMore,
}: {
  tab: Tab;
  onTab: (tab: Tab) => void;
  conversations: MessageConversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  meId?: string;
  search: string;
  onSearch: (value: string) => void;
  onNew: () => void;
  hasMore: boolean;
  onMore: () => void;
  loadingMore: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-5">
        <h1 className="type-display text-3xl">Messages</h1>
        <Button size="sm" icon="edit" onClick={onNew}>
          New
        </Button>
      </header>
      <div className="grid gap-3 px-4 pb-3 sm:px-5">
        <div role="tablist" aria-label="Conversations" className="grid grid-cols-2 rounded-full bg-white/4 p-1 ring-1 ring-inset ring-white/8">
          {(
            [
              ["user", "Direct"],
              ["team", "Teams"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => onTab(value)}
              className={cn("h-9 rounded-full text-sm font-medium transition-colors", tab === value ? "bg-white/10 text-mist-50" : "text-mist-400 hover:text-mist-100")}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search" className={cn(inputClasses, "h-10 rounded-full pl-10 text-sm")} />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin scrollbar-thumb-white/12 scrollbar-track-transparent">
        {loading ? (
          <div aria-hidden="true" className="grid gap-1 px-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : conversations.length ? (
          <ul className="grid gap-0.5">
            {conversations.map((conversation) => {
              const unread = Number(conversation.unreadCount ?? 0);
              const active = conversation.id === selectedId;
              const other = conversation.type === "user" ? otherParticipant(conversation, meId) : null;
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                      active ? "bg-lavender-400/10 ring-1 ring-inset ring-lavender-400/25" : "hover:bg-white/4",
                    )}
                  >
                    <Avatar
                      src={conversationImage(conversation, meId)}
                      name={conversationTitle(conversation, meId)}
                      online={other?.isOnline}
                      tone={conversation.type === "user" ? "brand" : "ink"}
                      className={conversation.type === "user" ? "rounded-full" : "rounded-xl"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className={cn("min-w-0 flex-1 truncate text-sm", unread ? "font-semibold text-mist-50" : "font-medium text-mist-100")}>
                          {conversationTitle(conversation, meId)}
                        </span>
                        <span className={cn("shrink-0 text-xs tabular-nums", unread ? "text-lavender-300" : "text-mist-500")}>{listTime(conversation.lastMessageTime)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className={cn("min-w-0 flex-1 truncate text-sm", unread ? "text-mist-200" : "text-mist-500")}>
                          {conversation.type === "team-inbox" && <span className="text-lavender-300">Inbox · </span>}
                          {lastMessageOf(conversation, meId) ?? "No messages yet"}
                        </span>
                        {unread > 0 && (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-lavender-400 px-1.5 text-[0.68rem] font-semibold tabular-nums text-ink-950">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {hasMore && (
              <li className="px-2 pt-2">
                <Button tone="ghost" size="sm" className="w-full" disabled={loadingMore} onClick={onMore}>
                  {loadingMore ? "Loading…" : "Older conversations"}
                </Button>
              </li>
            )}
          </ul>
        ) : (
          <div className="grid justify-items-center gap-3 px-6 py-14 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-white/5 text-mist-400">
              <Icon name={tab === "team" ? "team" : "messages"} className="size-5" />
            </span>
            <p className="text-sm font-semibold">{search ? "Nothing matches" : tab === "team" ? "No team chats yet" : "No conversations yet"}</p>
            <p className="max-w-60 text-sm text-mist-500">
              {search ? "Try another name." : tab === "team" ? "Team chats appear when you join a team. You can also message a team you're not on." : "Message a player to set up a scrim, a challenge or just say GG."}
            </p>
            {!search && (
              <Button tone="outline" size="sm" icon="edit" onClick={onNew}>
                New message
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
