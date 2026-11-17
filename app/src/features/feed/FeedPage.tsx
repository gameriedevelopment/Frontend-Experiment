import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { getApiErrorMessage } from "@/lib/errors";
import { FeedRail } from "./components/FeedRail";
import { PostCard } from "./components/PostCard";
import { PostComposer } from "./components/PostComposer";
import { PostSkeleton } from "./components/PostSkeleton";
import { useFeedPosts } from "./hooks";
import type { FeedFilter } from "./types";

const views: Array<{ id: FeedFilter; label: string }> = [
  { id: "all", label: "For you" },
  { id: "following", label: "Following" },
  { id: "teams", label: "Teams" },
];

const emptyCopy: Record<FeedFilter, { title: string; description: string }> = {
  all: { title: "The community is quiet", description: "Post the first result, clip or question. It goes on your profile and here." },
  following: { title: "Nothing from people you follow yet", description: "Follow players and teams to fill this view, or switch to For you." },
  teams: { title: "No team posts yet", description: "Posts from teams you're on or follow show up here." },
};

export function FeedPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("view") as FeedFilter | null;
  const filter: FeedFilter = views.some((view) => view.id === requested) ? requested! : "all";
  const query = useFeedPosts(filter);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
      <div className="mx-auto grid w-full max-w-2xl grid-cols-[minmax(0,1fr)] gap-6">
        <header>
          <h1 className="type-display text-heading">Feed</h1>
          <p className="mt-3 text-[0.95rem] text-mist-400">Results, clips and conversation from the players and teams around you.</p>
        </header>

        <PostComposer />

        <Tabs
          label="Feed"
          indicatorId="feed-view"
          items={views}
          value={filter}
          onChange={(value) => setParams(value === "all" ? {} : { view: value }, { replace: true })}
        />

        <section aria-label="Posts" aria-busy={query.isLoading} className="grid grid-cols-[minmax(0,1fr)] gap-4">
          {query.isLoading ? (
            <PostSkeleton count={3} />
          ) : query.isError ? (
            <StatePanel
              icon="warning"
              tone="danger"
              title="The feed didn't load"
              description={getApiErrorMessage(query.error, "We couldn't reach Gamerie. Your posts are safe.")}
              action={
                <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
                  Try again
                </Button>
              }
            />
          ) : posts.length ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <StatePanel icon="feed" title={emptyCopy[filter].title} description={emptyCopy[filter].description} />
          )}

          <div ref={sentinel} aria-hidden="true" />
          {isFetchingNextPage && <PostSkeleton count={1} media={false} />}
          {hasNextPage && !isFetchingNextPage && (
            <Button tone="outline" size="sm" className="mx-auto" onClick={() => void fetchNextPage()}>
              Load more
            </Button>
          )}
          {!hasNextPage && posts.length > 0 && (
            <p className="flex items-center justify-center gap-2 py-6 text-sm text-mist-500">
              <span className="grid size-5 place-items-center rounded-full bg-signal/12 text-signal">
                <Icon name="check" weight="bold" className="size-3" />
              </span>
              You're all caught up
            </p>
          )}
        </section>
      </div>
      <FeedRail />
    </div>
  );
}
