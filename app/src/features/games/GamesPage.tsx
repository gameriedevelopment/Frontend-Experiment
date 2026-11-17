import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { GameCard } from "./components/GameCard";
import { useGameFacets, useGames, useGameStatsBatch } from "./hooks";
import type { Game, GameFilters } from "./types";

const sorts = [
  { value: "popular" as const, label: "Most played" },
  { value: "name" as const, label: "A–Z" },
];

/** One page of cards with its own stats request, so loading more never refetches earlier pages. */
function GameCards({ games }: { games: Game[] }) {
  const stats = useGameStatsBatch(games.map((game) => game.id));
  return games.map((game) => <GameCard key={game.id} game={game} stats={stats.data?.[game.id]} statsLoading={stats.isLoading} />);
}

export function GamesPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const term = useDebouncedValue(search.trim());
  const type = params.get("type") ?? "";
  const platform = params.get("platform") ?? "";
  const sort = params.get("sort") === "name" ? "name" : "popular";
  const filters = useMemo<GameFilters>(() => ({ search: term || undefined, gameType: type || undefined, platform: platform || undefined, sort }), [platform, sort, term, type]);
  const query = useGames(filters);
  const facets = useGameFacets();
  const pages = query.data?.pages ?? [];
  const total = pages[0]?.total ?? 0;
  const filtered = Boolean(term || type || platform);

  const facetGames = facets.data?.data ?? [];
  const types = useMemo(() => [...new Set(facetGames.map((game) => game.gameType).filter((value): value is string => Boolean(value)))].sort(), [facetGames]);
  const platforms = useMemo(() => [...new Set(facetGames.flatMap((game) => game.platforms ?? []))].sort(), [facetGames]);

  const setParam = (key: string, value?: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    // Mirror the debounced search into the URL so a search survives reloads and sharing.
    setParams(
      (current) => {
        if ((current.get("q") ?? "") === term) return current;
        const next = new URLSearchParams(current);
        if (term) next.set("q", term);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [setParams, term]);

  const clear = () => {
    setSearch("");
    setParams(sort === "name" ? { sort } : {}, { replace: true });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader title="Games" description="Find the players, teams and tournaments around each game you play." />

      <div className="grid gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1 basis-64">
            <span className="sr-only">Search games</span>
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, studio or genre"
              className={cn(inputClasses, "h-11 rounded-full pl-11")}
            />
          </label>
          {types.length > 0 && <FilterMenu label="Genre" value={type} options={types} onChange={(value) => setParam("type", value)} />}
          {platforms.length > 0 && <FilterMenu label="Platform" value={platform} options={platforms} onChange={(value) => setParam("platform", value)} />}
          <Segmented label="Sort" options={sorts} value={sort} onChange={(value) => setParam("sort", value === "popular" ? undefined : value)} />
        </div>

        {query.isLoading ? (
          <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-80 rounded-card" />
            ))}
          </div>
        ) : query.isError ? (
          <StatePanel
            icon="warning"
            tone="danger"
            title="Games didn't load"
            description={getApiErrorMessage(query.error, "Try again in a moment.")}
            action={
              <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : total ? (
          <>
            {filtered && (
              <p className="text-sm text-mist-500">
                {total.toLocaleString()} {total === 1 ? "game matches" : "games match"}
              </p>
            )}
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pages.map((page) => (
                <GameCards key={page.page} games={page.data} />
              ))}
            </div>
            {query.hasNextPage && (
              <Button tone="outline" size="sm" className="mx-auto" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                {query.isFetchingNextPage ? "Loading…" : "Show more"}
              </Button>
            )}
          </>
        ) : (
          <StatePanel
            icon="games"
            title={filtered ? "No games match" : "No games yet"}
            description={filtered ? "Try another search or clear a filter." : "Games appear here as they're added to Gamerie."}
            action={
              filtered ? (
                <Button tone="outline" size="sm" onClick={clear}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
