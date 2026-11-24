import { useInfiniteQuery } from "@tanstack/react-query";
import { Panel } from "@/components/layout/Panel";
import { RichText } from "@/components/record/RichText";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { communicationsKey, listAnnouncements } from "../api";

export function AnnouncementHistory() {
  const history = useInfiniteQuery({
    queryKey: [...communicationsKey, "history"],
    queryFn: ({ pageParam }) => listAnnouncements(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
  const posts = history.data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <Panel title="Announcement history">
      {history.isLoading ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : history.isError && !history.data ? (
        <StatePanel icon="warning" tone="danger" title="Announcements didn't load" description={getApiErrorMessage(history.error, "Try again in a moment.")}
          action={<Button size="sm" tone="outline" icon="refresh" onClick={() => void history.refetch()}>Try again</Button>}
        />
      ) : posts.length ? (
        <>
          <ul className="divide-y divide-white/6">
            {posts.map((post) => (
              <li key={post.id} className="grid grid-cols-[minmax(0,1fr)] gap-2 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="wrap-anywhere text-sm font-semibold text-mist-100">{post.authorName}</p>
                  <time className="font-mono text-xs text-mist-400" dateTime={post.createdAt}>{formatDateTime(post.createdAt)}</time>
                </div>
                <RichText content={post.content} className="overflow-x-auto" />
              </li>
            ))}
          </ul>
          {history.isFetchNextPageError && <Notice tone="danger" className="mt-4">{getApiErrorMessage(history.error, "Older announcements didn't load.")}</Notice>}
          {history.hasNextPage && <Button tone="outline" size="sm" className="mt-5" disabled={history.isFetching} onClick={() => void history.fetchNextPage()}>{history.isFetchingNextPage ? "Loading…" : "Load older announcements"}</Button>}
        </>
      ) : (
        <StatePanel icon="megaphone" title="No announcements yet" />
      )}
    </Panel>
  );
}
