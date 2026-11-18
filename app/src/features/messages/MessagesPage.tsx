import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/features/auth/authStore";
import { cn } from "@/lib/cn";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { ConversationList } from "./components/ConversationList";
import { MessageThread } from "./components/MessageThread";
import { NewConversationDialog } from "./components/NewConversationDialog";
import { flattenConversations, useConversationSearch, useConversationUnread, useConversations, useMessages } from "./hooks";
import type { MessageConversation } from "./types";

export function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const tab: "user" | "team" = params.get("tab") === "team" ? "team" : "user";
  const selectedId = params.get("conversation");
  const [search, setSearch] = useState("");
  const [composing, setComposing] = useState(false);
  const [created, setCreated] = useState<MessageConversation | null>(null);
  const term = useDebouncedValue(search.trim());
  const direct = useConversations("user");
  const teams = useConversations("team");
  const list = tab === "team" ? teams : direct;
  const searched = useConversationSearch(term);
  const unreadByTab = useMemo(() => {
    const sum = (data: typeof direct.data) => flattenConversations(data).reduce((total, conversation) => total + Number(conversation.unreadCount ?? 0), 0);
    return { user: sum(direct.data), team: sum(teams.data) };
  }, [direct.data, teams.data]);

  // Opening Messages with only team chats unread goes straight to them.
  useEffect(() => {
    if (params.get("tab") || selectedId || !direct.data || !teams.data) return;
    if (unreadByTab.team > 0 && unreadByTab.user === 0) setParams({ tab: "team" }, { replace: true });
  }, [direct.data, params, selectedId, setParams, teams.data, unreadByTab]);

  const conversations = useMemo(() => {
    const source = term.length >= 2 ? (searched.data ?? []) : flattenConversations(list.data);
    return source.filter((conversation) => (tab === "user" ? conversation.type === "user" : conversation.type !== "user"));
  }, [list.data, searched.data, tab, term]);

  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ??
    flattenConversations(list.data).find((conversation) => conversation.id === selectedId) ??
    (created?.id === selectedId ? created : null);
  const messages = useMessages(selected?.id);
  const unread = useConversationUnread(selected?.id);
  const ordered = useMemo(() => messages.data?.pages.flatMap((page) => page.data).reverse() ?? [], [messages.data]);

  // On wide screens the newest conversation opens by default; on phones the list comes first.
  useEffect(() => {
    if (selectedId || !conversations.length || window.matchMedia("(max-width: 1023px)").matches) return;
    setParams({ tab, conversation: conversations[0].id }, { replace: true });
  }, [conversations, selectedId, setParams, tab]);

  const select = (id: string) => setParams({ tab, conversation: id }, { replace: false });
  const back = () => setParams({ tab }, { replace: true });

  return (
    <div className="-mx-4 -mb-[calc(6rem+env(safe-area-inset-bottom))] -mt-8 h-[calc(100svh-4rem)] sm:-mx-6 lg:-mx-10 lg:-mb-16 lg:-mt-10">
      <div className="grid h-full grid-cols-[minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className={cn("min-h-0 border-white/6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:border-r lg:pb-0", selectedId && "hidden lg:block")}>
          <ConversationList
            tab={tab}
            unread={unreadByTab}
            onTab={(next) => {
              setSearch("");
              setParams({ tab: next }, { replace: true });
            }}
            conversations={conversations}
            loading={list.isLoading || (term.length >= 2 && searched.isLoading)}
            selectedId={selected?.id ?? null}
            onSelect={select}
            meId={user?.id}
            search={search}
            onSearch={setSearch}
            onNew={() => setComposing(true)}
            hasMore={Boolean(list.hasNextPage) && term.length < 2}
            onMore={() => void list.fetchNextPage()}
            loadingMore={list.isFetchingNextPage}
          />
        </aside>
        <section
          aria-label="Conversation"
          className={cn("min-h-0 bg-ink-950", selectedId ? "fixed inset-0 z-55 lg:static lg:z-auto" : "hidden lg:block")}
        >
          {selected ? (
            <MessageThread
              key={selected.id}
              conversation={selected}
              messages={ordered}
              loading={messages.isLoading}
              unread={Number(unread.data ?? 0)}
              hasOlder={Boolean(messages.hasNextPage)}
              fetchingOlder={messages.isFetchingNextPage}
              onLoadOlder={() => messages.fetchNextPage()}
              onBack={back}
            />
          ) : (
            <div className="grid h-full place-items-center p-8">
              <div className="grid max-w-sm justify-items-center gap-4 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-lavender-400/10 text-lavender-300">
                  <Icon name="messages" className="size-6" />
                </span>
                <p className="type-display text-2xl">Your messages</p>
                <p className="text-sm text-mist-400">Talk to players and teams: set up scrims, agree challenge times, or just say GG.</p>
                <Button icon="edit" onClick={() => setComposing(true)}>
                  New message
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
      <NewConversationDialog
        open={composing}
        onClose={() => setComposing(false)}
        onCreated={(conversation, nextTab) => {
          setCreated(conversation);
          setComposing(false);
          setParams({ tab: nextTab, conversation: conversation.id }, { replace: false });
        }}
      />
    </div>
  );
}
