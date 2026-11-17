import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/features/auth/authStore";
import { usePlayerSuggestions } from "@/features/discovery/hooks";
import { PlayersToFollow } from "@/features/home/components/PlayersToFollow";
import { useTrendingTopics } from "../hooks";

function Trending() {
  const query = useTrendingTopics();
  const topics = (query.data ?? []).slice(0, 5);
  return (
    <section aria-labelledby="trending" className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6">
      <header className="flex items-center justify-between gap-3">
        <h2 id="trending" className="text-base font-semibold">
          Trending now
        </h2>
        <Icon name="trendUp" className="size-4 text-lavender-300" />
      </header>
      {query.isLoading ? (
        <div aria-hidden="true" className="mt-4 grid gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-9 rounded-xl" />
          ))}
        </div>
      ) : topics.length ? (
        <ol className="mt-3 grid">
          {topics.map((topic, index) => {
            const label = topic.tag ?? topic.topic ?? "Topic";
            const count = topic.count ?? topic.postCount ?? topic.commentCount;
            return (
              <li key={topic.id ?? `${label}-${index}`} className="border-t border-white/5 first:border-t-0">
                <Link to={`/search?tag=${encodeURIComponent(label.replace(/^#/, ""))}`} className="group -mx-2 flex items-baseline gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/3">
                  <span className="type-label w-5 shrink-0 text-mist-500">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-mist-100 transition-colors group-hover:text-lavender-200">{label.startsWith("#") ? label : `#${label}`}</span>
                  {typeof count === "number" && (
                    <span className="shrink-0 text-xs tabular-nums text-mist-500" title={`${count.toLocaleString()} posts`}>
                      {new Intl.NumberFormat(undefined, { notation: "compact" }).format(count)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-mist-500">
          {query.isError ? "Trending topics aren't available right now." : "Topics show up here as the community gets talking."}
        </p>
      )}
    </section>
  );
}

export function FeedRail() {
  const user = useAuthStore((state) => state.user);
  const suggestions = usePlayerSuggestions();
  return (
    <aside aria-label="Around Gamerie" className="hidden gap-6 xl:sticky xl:top-24 xl:grid">
      <Trending />
      {user?.id && (
        <PlayersToFollow
          players={suggestions.data?.data ?? []}
          currentUserId={user.id}
          loading={suggestions.isLoading}
          failed={suggestions.isError}
          onRetry={() => void suggestions.refetch()}
        />
      )}
      <p className="px-1 text-xs leading-relaxed text-mist-500">Your feed follows the players, teams and hubs you choose. Nothing is boosted.</p>
    </aside>
  );
}
