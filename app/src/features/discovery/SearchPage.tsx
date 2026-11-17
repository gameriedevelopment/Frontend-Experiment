import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { useAuthStore } from "@/features/auth/authStore";
import { hrefOf } from "@/features/communities/format";
import { useTrendingTopics } from "@/features/feed/hooks";
import { plainTextPreview } from "@/features/feed/richContent";
import { GameTile } from "@/features/games/components/GameTile";
import { useGameOptions } from "@/features/games/hooks";
import type { PlayerProfile } from "@/features/profile/types";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/time";
import { MIN_SEARCH_LENGTH, useSearchResults, useUnifiedSearch } from "./hooks";
import type { SearchGame, SearchHub, SearchKind, SearchPost, SearchTeam } from "./types";

type Tab = "top" | SearchKind;
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "top", label: "Top" },
  { id: "players", label: "Players" },
  { id: "teams", label: "Teams" },
  { id: "hubs", label: "Hubs" },
  { id: "games", label: "Games" },
  { id: "posts", label: "Posts" },
];
const topSections: Array<{ kind: SearchKind; title: string; take: number }> = [
  { kind: "players", title: "Players", take: 4 },
  { kind: "teams", title: "Teams", take: 3 },
  { kind: "hubs", title: "Hubs", take: 3 },
  { kind: "games", title: "Games", take: 4 },
  { kind: "posts", title: "Posts", take: 3 },
];
const emptyIcons: Record<SearchKind, IconName> = { players: "follow", teams: "team", hubs: "hub", games: "games", posts: "comment" };

const recentKey = (userId?: string) => `Gamerie_recent_searches:${userId ?? "guest"}`;
function readRecent(userId?: string): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(recentKey(userId)) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}
function writeRecent(userId: string | undefined, items: string[]) {
  try {
    if (items.length) localStorage.setItem(recentKey(userId), JSON.stringify(items));
    else localStorage.removeItem(recentKey(userId));
  } catch {
    // Recent searches are a convenience; storage can be unavailable.
  }
}

const rowClass = "group flex items-center gap-3 rounded-2xl px-3 py-2.5 outline-none transition-colors hover:bg-white/4 focus-visible:bg-white/4";
const meta = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" · ");
const plural = (count: number, word: string) => `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`;

function RowArrow() {
  return <Icon name="arrowRight" className="size-3.5 shrink-0 text-mist-500 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />;
}

function PlayerRow({ player }: { player: PlayerProfile }) {
  return (
    <Link to={`/profile/${encodeURIComponent(player.username)}`} className={rowClass}>
      <Avatar src={player.profileImage} name={player.username} online={player.isOnline} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold group-hover:text-lavender-100">{player.username}</span>
        <span className="block truncate text-xs text-mist-500">{meta(player.gamerTitle, player.gameLevel, player.region) || "Player"}</span>
      </span>
      <RowArrow />
    </Link>
  );
}

function TeamRow({ team }: { team: SearchTeam }) {
  const members = team.members?.length ?? 0;
  const titles = team.stats?.tournamentWins ?? 0;
  return (
    <Link to={hrefOf("team", { id: team.id, slug: team.slug ?? undefined })} className={rowClass}>
      <Avatar src={team.logo} name={team.name} tone="ink" className="rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold group-hover:text-lavender-100">{team.name}</span>
        <span className="block truncate text-xs text-mist-500">{meta(team.level, members > 0 && plural(members, "member"), titles > 0 && plural(titles, "title")) || "Team"}</span>
      </span>
      <RowArrow />
    </Link>
  );
}

function HubRow({ hub }: { hub: SearchHub }) {
  const members = hub.membersCount ?? 0;
  const teams = hub.teamsCount ?? 0;
  return (
    <Link to={hrefOf("hub", { id: hub.id, slug: hub.slug ?? undefined })} className={rowClass}>
      <Avatar src={hub.logo} name={hub.name} tone="ink" className="rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold group-hover:text-lavender-100">{hub.name}</span>
        <span className="block truncate text-xs text-mist-500">
          {meta(hub.type === "organization" ? "Organization" : "Community", hub.region, members > 0 && plural(members, "member"), teams > 0 && plural(teams, "team"))}
        </span>
      </span>
      <RowArrow />
    </Link>
  );
}

function PostRow({ post }: { post: SearchPost }) {
  return (
    <Link to={`/post/${post.id}`} className="group flex gap-3 rounded-2xl px-3 py-3 outline-none transition-colors hover:bg-white/4 focus-visible:bg-white/4">
      <Avatar src={post.authorImage} name={post.authorName || "Player"} size="sm" className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2 text-xs text-mist-500">
          <span className="truncate font-semibold text-mist-200">{post.authorName || "Player"}</span>
          {post.createdAt && <span className="shrink-0">{timeAgo(post.createdAt)}</span>}
        </span>
        <span className="mt-0.5 line-clamp-3 text-sm leading-relaxed text-mist-100">{plainTextPreview(post.content) || "Open the post to read it."}</span>
        {post.tags?.length ? (
          <span className="mt-1.5 block truncate text-xs text-lavender-300">
            {post.tags
              .slice(0, 4)
              .map((tag) => `#${tag.replace(/^#/, "")}`)
              .join("  ")}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function Results({ kind, items }: { kind: SearchKind; items: unknown[] }) {
  if (kind === "games")
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(items as SearchGame[]).map((game) => (
          <GameTile key={game.id} game={game} />
        ))}
      </div>
    );
  return (
    <ul className="grid grid-cols-[minmax(0,1fr)]">
      {items.map((item) => {
        const id = (item as { id: string }).id;
        return (
          <li key={id}>
            {kind === "players" ? (
              <PlayerRow player={item as PlayerProfile} />
            ) : kind === "teams" ? (
              <TeamRow team={item as SearchTeam} />
            ) : kind === "hubs" ? (
              <HubRow hub={item as SearchHub} />
            ) : (
              <PostRow post={item as SearchPost} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ResultsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="grid gap-1 rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="size-10 rounded-full" />
          <div className="grid flex-1 gap-1.5">
            <Skeleton className="h-3.5 w-2/5 rounded-full" />
            <Skeleton className="h-3 w-3/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <StatePanel
      icon="warning"
      tone="danger"
      title="Search didn't go through"
      description={getApiErrorMessage(error, "Try again in a moment.")}
      action={
        <Button tone="outline" size="sm" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}

function TopResults({ term, onMore }: { term: string; onMore: (kind: SearchKind) => void }) {
  const players = useSearchResults("players", term);
  const teams = useSearchResults("teams", term);
  const hubs = useSearchResults("hubs", term);
  const games = useSearchResults("games", term);
  const posts = useSearchResults("posts", term);
  const queries = { players, teams, hubs, games, posts };
  const all = Object.values(queries);
  const settled = all.every((query) => !query.isLoading);
  const sections = topSections.map((section) => ({ ...section, page: queries[section.kind].data })).filter((section) => section.page?.data.length);

  if (!settled && !sections.length) return <ResultsSkeleton />;
  if (all.every((query) => query.isError)) return <SearchError error={players.error} onRetry={() => all.forEach((query) => void query.refetch())} />;
  if (settled && !sections.length) return <StatePanel icon="search" title={`Nothing matches "${term}"`} description="Check the spelling, or try a shorter or broader search." />;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {sections.map(({ kind, title, take, page }) => {
        const items = page!.data.slice(0, take);
        return (
          <section key={kind} aria-label={title} className={cn("rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6", kind === "games" ? "p-4 sm:p-5" : "p-2 pt-4")}>
            <header className={cn("flex items-baseline justify-between gap-3", kind === "games" ? "mb-3" : "mb-1 px-3")}>
              <h2 className="text-base font-semibold">{title}</h2>
              {page!.total > items.length && (
                <button type="button" onClick={() => onMore(kind)} className="flex items-center gap-1 text-sm font-medium text-lavender-300 hover:text-lavender-200">
                  See all
                  <Icon name="arrowRight" className="size-3.5" />
                </button>
              )}
            </header>
            <Results kind={kind} items={items} />
          </section>
        );
      })}
      {!settled && <ResultsSkeleton rows={2} />}
    </div>
  );
}

function KindResults({ kind, term }: { kind: SearchKind; term: string }) {
  const query = useUnifiedSearch(kind, term);
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && !isFetchingNextPage && void fetchNextPage(), { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (query.isLoading) return kind === "games" ? <Skeleton className="h-72 rounded-card" /> : <ResultsSkeleton />;
  if (query.isError) return <SearchError error={query.error} onRetry={() => void query.refetch()} />;
  if (!items.length) return <StatePanel icon={emptyIcons[kind]} title={`No ${kind} match "${term}"`} description="Check the spelling, or try a shorter or broader search." />;
  return (
    <section aria-label={`${kind} results`} className={cn(kind !== "games" && "rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6")}>
      <Results kind={kind} items={items} />
      <div ref={sentinel} aria-hidden="true" />
      {isFetchingNextPage && <Skeleton className={kind === "games" ? "mt-3 h-40 rounded-2xl" : "m-2 h-14 rounded-2xl"} />}
    </section>
  );
}

function Discover({ recent, onPick, onClear }: { recent: string[]; onPick: (value: string) => void; onClear: () => void }) {
  const trending = useTrendingTopics();
  const popular = useGameOptions("");
  const topics = [...new Set((trending.data ?? []).map((topic) => (topic.tag ?? topic.topic ?? "").replace(/^#/, "")).filter(Boolean))].slice(0, 8);
  const chip = "flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-sm text-mist-200 ring-1 ring-inset ring-white/8 transition-colors hover:bg-white/8 hover:text-mist-50";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      {recent.length > 0 && (
        <section aria-labelledby="recent-searches">
          <header className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="recent-searches" className="text-base font-semibold">
              Recent
            </h2>
            <button type="button" onClick={onClear} className="text-sm font-medium text-mist-400 hover:text-mist-100">
              Clear
            </button>
          </header>
          <div className="flex flex-wrap gap-2">
            {recent.map((item) => (
              <button key={item} type="button" onClick={() => onPick(item)} className={chip}>
                <Icon name="history" className="size-3.5 text-mist-500" />
                {item}
              </button>
            ))}
          </div>
        </section>
      )}
      {topics.length > 0 && (
        <section aria-labelledby="trending-searches">
          <h2 id="trending-searches" className="mb-3 text-base font-semibold">
            Trending now
          </h2>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button key={topic} type="button" onClick={() => onPick(`#${topic}`)} className={chip}>
                <Icon name="trendUp" className="size-3.5 text-lavender-300" />#{topic}
              </button>
            ))}
          </div>
        </section>
      )}
      <section aria-labelledby="popular-games">
        <header className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="popular-games" className="text-base font-semibold">
            Popular games
          </h2>
          <Link to="/games" className="flex items-center gap-1 text-sm font-medium text-lavender-300 hover:text-lavender-200">
            All games
            <Icon name="arrowRight" className="size-3.5" />
          </Link>
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {popular.isLoading
            ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="aspect-4/3 rounded-2xl" />)
            : (popular.data?.data ?? []).slice(0, 8).map((game) => <GameTile key={game.id} game={game} />)}
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { to: "/users", icon: "follow" as const, title: "Find players", text: "Filter by game, level, platform and region." },
          { to: "/teams", icon: "team" as const, title: "Find a team", text: "Browse teams by game, level and region." },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="group flex items-center gap-4 rounded-card bg-ink-900/60 p-4 ring-1 ring-inset ring-white/6 transition-colors hover:bg-ink-900">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lavender-400/10 text-lavender-300">
              <Icon name={item.icon} className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold group-hover:text-lavender-100">{item.title}</span>
              <span className="block text-xs text-mist-500">{item.text}</span>
            </span>
            <RowArrow />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SearchPage() {
  const user = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const tag = params.get("tag")?.replace(/^#/, "");
  const urlTerm = (params.get("q") ?? (tag ? `#${tag}` : "")).trim();
  const [input, setInput] = useState(urlTerm);
  const lastSynced = useRef(urlTerm);
  const writeTimer = useRef<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const requested = params.get("type") as Tab | null;
  const tab: Tab = tabs.some((item) => item.id === requested) ? requested! : tag ? "posts" : "top";
  const [recent, setRecent] = useState(() => readRecent(user?.id));

  // Links into search (hashtags, the header) change the URL; reflect them in the field.
  useEffect(() => {
    if (urlTerm === lastSynced.current) return;
    lastSynced.current = urlTerm;
    window.clearTimeout(writeTimer.current);
    setInput(urlTerm);
  }, [urlTerm]);
  useEffect(() => () => window.clearTimeout(writeTimer.current), []);

  // Only typing writes the URL, after a pause, so results, reloads and shared links agree
  // and a link into search can never be overwritten by a stale keystroke.
  const write = (value: string, delay: number) => {
    setInput(value);
    window.clearTimeout(writeTimer.current);
    writeTimer.current = window.setTimeout(() => {
      const term = value.trim();
      if (term === lastSynced.current) return;
      lastSynced.current = term;
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          if (term) next.set("q", term);
          else next.delete("q");
          next.delete("tag");
          return next;
        },
        { replace: true },
      );
    }, delay);
  };

  useEffect(() => {
    if (urlTerm.length < MIN_SEARCH_LENGTH) return;
    const timer = window.setTimeout(() => {
      const next = [urlTerm, ...readRecent(user?.id).filter((item) => item.toLowerCase() !== urlTerm.toLowerCase())].slice(0, 8);
      setRecent(next);
      writeRecent(user?.id, next);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [urlTerm, user?.id]);

  const setTab = (next: Tab) => {
    setParams(
      (current) => {
        const nextParams = new URLSearchParams(current);
        if (next === "top") nextParams.delete("type");
        else nextParams.set("type", next);
        return nextParams;
      },
      { replace: true },
    );
    window.scrollTo({ top: 0 });
  };
  const pick = (value: string) => {
    write(value, 0);
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-[minmax(0,1fr)] gap-6">
      <form role="search" onSubmit={(event) => event.preventDefault()} className="relative">
        <label htmlFor="search-page-input" className="sr-only">
          Search Gamerie
        </label>
        <Icon name="search" className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-mist-400" />
        <input
          ref={inputRef}
          id="search-page-input"
          data-global-search
          type="search"
          autoFocus
          autoComplete="off"
          enterKeyHint="search"
          value={input}
          onChange={(event) => write(event.target.value, 300)}
          onKeyDown={(event) => event.key === "Escape" && input && pick("")}
          placeholder="Search players, teams, hubs, games and posts"
          className="h-14 w-full rounded-full bg-ink-900/80 pl-14 pr-14 text-base outline-none ring-1 ring-inset ring-white/10 transition-shadow placeholder:text-mist-500 focus:ring-2 focus:ring-lavender-400 sm:h-16 sm:text-lg [&::-webkit-search-cancel-button]:hidden"
        />
        {input && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => pick("")}
            className="absolute right-4 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-mist-400 hover:bg-white/6 hover:text-mist-50"
          >
            <Icon name="close" className="size-4" />
          </button>
        )}
      </form>

      {urlTerm.length >= MIN_SEARCH_LENGTH ? (
        <>
          <Tabs label="Result types" indicatorId="search-tabs" items={tabs} value={tab} onChange={setTab} />
          {tab === "top" ? <TopResults term={urlTerm} onMore={setTab} /> : <KindResults kind={tab} term={urlTerm} />}
        </>
      ) : input.trim() ? (
        <p className="py-6 text-center text-sm text-mist-500">Keep typing to search.</p>
      ) : (
        <Discover
          recent={recent}
          onPick={pick}
          onClear={() => {
            setRecent([]);
            writeRecent(user?.id, []);
          }}
        />
      )}
    </div>
  );
}
