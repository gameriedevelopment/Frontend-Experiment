import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { PostCard } from "@/features/feed/components/PostCard";
import { PostComposer } from "@/features/feed/components/PostComposer";
import { getApiErrorMessage } from "@/lib/errors";
import { usePlayerPosts } from "../hooks";
import type { PlayerProfile } from "../types";

export function ProfilePosts({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const query = usePlayerPosts(profile.id);
  const posts = query.data ?? [];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {own && <PostComposer />}
      {query.isLoading ? (
        <div aria-hidden="true" className="grid gap-4">
          <Skeleton className="h-44 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      ) : query.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="Posts could not load"
          description={getApiErrorMessage(query.error, "Please try again in a moment.")}
          action={
            <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : posts.length ? (
        <>
          <p className="type-label px-1 text-mist-500">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </>
      ) : (
        <StatePanel
          icon="feed"
          title={own ? "Nothing posted yet" : "No posts yet"}
          description={
            own
              ? "Share a result, a clip or what you're playing. Posts appear here and in your followers' feeds."
              : `${profile.username} hasn't posted anything yet.`
          }
        />
      )}
    </div>
  );
}
