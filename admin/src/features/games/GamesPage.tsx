import { SearchField } from "@/components/data/SearchField";
import { SegmentStrip } from "@/components/data/SegmentStrip";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { PLATFORMS } from "./catalog";
import { GameCard } from "./GameCard";
import { useGameSummary, useGames } from "./hooks";
import type { GameCoverage, GameQuery } from "./types";

const DEFAULTS = { search: "", coverage: "", platform: "", sort: "", page: "1" };
const LIMIT = 24;

export function GamesPage() {
  useDocumentTitle("Games");
  const [state, set] = useQueryState(DEFAULTS);
  const query: GameQuery = {
    page: Math.max(1, Number(state.page) || 1),
    limit: LIMIT,
    search: state.search || undefined,
    platform: state.platform || undefined,
    coverage: (state.coverage || undefined) as GameCoverage | undefined,
    sort: state.sort === "popular" ? "popular" : undefined,
  };
  const games = useGames(query);
  const summary = useGameSummary().data;
  const liveKeys = new Set(summary?.integrationKeys ?? []);
  const rows = games.data?.data ?? [];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        title="Games"
        description="The catalog players add to their profiles and competitions are built on."
        refresh={[["admin", "games"]]}
        actions={
          <LinkButton to="/games/new" size="sm" icon="plus">
            Add game
          </LinkButton>
        }
      />
      <SegmentStrip
        loading={!summary}
        active={state.coverage || null}
        onPick={(key) => set({ coverage: key && key !== "all" ? key : "" })}
        segments={[
          { key: "all", label: "All", value: summary?.counts.total, hint: "In the catalog" },
          { key: "live", label: "Live stats", value: summary?.counts.live, hint: "Synced from the game" },
          { key: "verified", label: "Verified results", value: summary?.counts.verified, hint: "Screenshots checked" },
          { key: "unplayed", label: "No players", value: summary?.counts.unplayed, hint: "Nobody lists it yet" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search games, publishers, genres" className="w-full sm:w-80" />
        <FilterMenu label="Platform" value={state.platform} onChange={(platform) => set({ platform })} options={PLATFORMS} />
        <FilterMenu label="Order" anyLabel="A to Z" value={state.sort} onChange={(sort) => set({ sort })} options={[{ value: "popular", label: "Most played" }]} />
      </div>

      {games.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="Games didn't load"
          description={getApiErrorMessage(games.error, "Try again in a moment.")}
          action={
            <Button tone="outline" size="sm" icon="refresh" onClick={() => void games.refetch()}>
              Try again
            </Button>
          }
        />
      ) : games.isLoading ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4" aria-busy="true">
          {Array.from({ length: 8 }, (_, index) => (
            <li key={index} className="overflow-hidden rounded-card ring-1 ring-inset ring-white/6">
              <Skeleton className="aspect-video w-full rounded-none" />
              <div className="grid gap-2 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <StatePanel
          icon="games"
          title={state.search || state.coverage || state.platform ? "No games match" : "The catalog is empty"}
          description={state.search || state.coverage || state.platform ? "Try another search or clear a filter." : "Games you add here show up for players to pick."}
        />
      ) : (
        <ul className={cn("grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4 transition-opacity", games.isFetching && "opacity-70")}>
          {rows.map((game) => (
            <li key={game.id} className="grid">
              <GameCard game={game} live={Boolean(game.integrationKey && liveKeys.has(game.integrationKey))} />
            </li>
          ))}
        </ul>
      )}
      {games.data && games.data.total > LIMIT && <TableFooter page={query.page} limit={LIMIT} total={games.data.total} onPage={(page) => set({ page: String(page) })} />}
    </div>
  );
}
