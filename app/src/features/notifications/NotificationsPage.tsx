import { Fragment, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { useAuthStore } from "@/features/auth/authStore";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { NotificationRow } from "./components/NotificationRow";
import { groupLabel } from "./format";
import { flattenNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useNotificationUnreadCount, useNotifications } from "./hooks";
import type { NotificationFilter } from "./types";

const filters: Array<{ id: NotificationFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "social", label: "Social" },
  { id: "teams", label: "Teams" },
  { id: "competitive", label: "Matches" },
  { id: "wallet", label: "Wallet" },
  { id: "updates", label: "Updates" },
];

export function NotificationsPage() {
  const user = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const requested = params.get("filter") as NotificationFilter | null;
  const filter: NotificationFilter = filters.some((item) => item.id === requested) ? requested! : "all";
  const unreadOnly = params.get("unread") === "1";
  const query = useNotifications(user?.id, { filter, isRead: unreadOnly ? false : undefined });
  const unread = useNotificationUnreadCount(user?.id);
  const markRead = useMarkNotificationRead(user?.id);
  const markAll = useMarkAllNotificationsRead(user?.id);
  const items = flattenNotifications(query.data);
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const unreadCount = Number(unread.data ?? 0);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && !isFetchingNextPage && void fetchNextPage(), { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        title="Notifications"
        description={unreadCount ? `${unreadCount} unread` : "You're all caught up."}
        actions={
          <Button
            tone="outline"
            size="sm"
            icon="check"
            disabled={!unreadCount || markAll.isPending}
            onClick={() => markAll.mutate(undefined, { onSuccess: () => toast.success("All caught up"), onError: (error) => toast.error("Couldn't mark them read", getApiErrorMessage(error, "Try again in a moment.")) })}
          >
            Mark all read
          </Button>
        }
      />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <Tabs label="Notification types" indicatorId="notification-filter" items={filters} value={filter} onChange={(value) => setParam("filter", value === "all" ? null : value)} className="min-w-0 flex-1" />
        <div className="shrink-0 pb-3">
          <Switch label="Unread only" checked={unreadOnly} onChange={(checked) => setParam("unread", checked ? "1" : null)} />
        </div>
      </div>

      {query.isLoading ? (
        <div aria-hidden="true" className="grid gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-18 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="Notifications didn't load"
          description={getApiErrorMessage(query.error, "Try again in a moment.")}
          action={
            <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : items.length ? (
        <section aria-label="Notifications" className="rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6">
          <ul className="grid gap-0.5">
            {items.map((notification, index) => {
              const label = groupLabel(notification.createdAt);
              const showLabel = index === 0 || groupLabel(items[index - 1].createdAt) !== label;
              return (
                <Fragment key={notification.id}>
                  {showLabel && <li className="type-label px-4 pb-1.5 pt-4 text-mist-500 first:pt-2">{label}</li>}
                  <li>
                    <NotificationRow notification={notification} onOpen={(item) => !item.isRead && markRead.mutate(item.id)} />
                  </li>
                </Fragment>
              );
            })}
          </ul>
          <div ref={sentinel} aria-hidden="true" />
          {isFetchingNextPage && <Skeleton className="m-2 h-16 rounded-2xl" />}
        </section>
      ) : (
        <StatePanel
          icon="bell"
          title={unreadOnly ? "Nothing unread" : filter === "all" ? "No notifications yet" : "Nothing here yet"}
          description={unreadOnly ? "You've seen everything. New activity shows up here first." : "Follows, challenges, team news and results show up here as they happen."}
        />
      )}
    </div>
  );
}
