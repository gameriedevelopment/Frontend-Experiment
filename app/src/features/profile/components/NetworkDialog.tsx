import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { usePlayerConnections } from "../hooks";

export function NetworkDialog({
  kind,
  profileId,
  onClose,
}: {
  kind: "followers" | "following" | null;
  profileId: string;
  onClose: () => void;
}) {
  const query = usePlayerConnections(profileId, kind ?? "followers", Boolean(kind));
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const players = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const label = kind === "following" ? "Following" : "Followers";

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !query.hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !query.isFetchingNextPage) void query.fetchNextPage();
      },
      { rootMargin: "180px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);

  return (
    <Dialog open={Boolean(kind)} title={`${label}${total ? ` · ${total.toLocaleString()}` : ""}`} onClose={onClose}>
      <div className="grid gap-0.5">
        {query.isLoading &&
          Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="size-10 rounded-full" />
              <SkeletonText lines={2} className="flex-1" />
            </div>
          ))}

        {query.isError && (
          <div className="grid justify-items-center gap-3 px-4 py-10 text-center">
            <Icon name="warning" className="size-6 text-danger" weight="duotone" />
            <p className="text-sm font-semibold">This list could not load</p>
            <button type="button" onClick={() => void query.refetch()} className="text-sm font-medium text-lavender-300">
              Try again
            </button>
          </div>
        )}

        {!query.isLoading && !query.isError && !players.length && (
          <div className="grid justify-items-center gap-2 px-4 py-10 text-center">
            <Icon name="people" className="size-6 text-lavender-300" weight="duotone" />
            <p className="text-sm font-semibold">{kind === "following" ? "Not following anyone yet" : "No followers yet"}</p>
            <p className="text-sm text-mist-400">This list grows as players connect.</p>
          </div>
        )}

        {players.map((player) => (
          <Link
            key={player.id}
            to={`/profile/${player.username}`}
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/5"
          >
            <Avatar src={player.profileImage} name={player.username} online={player.isOnline} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{player.username}</span>
              <span className="block truncate text-xs text-mist-400">{player.gamerTitle || "Gamerie player"}</span>
            </span>
          </Link>
        ))}
        <div ref={loadMoreRef} aria-hidden="true" />
      </div>
    </Dialog>
  );
}
