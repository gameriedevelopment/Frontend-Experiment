import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { GameFilter } from "@/features/games/components/GameFilter";
import { REGIONS } from "@/features/tournaments/create/draftForm";
import { LadderCard } from "./components/LadderCard";
import { useLadders } from "./hooks";
import type { LadderEntrantType, LadderFilters, LadderHostType, LadderJoinMode, LadderView } from "./types";

const views: Array<{ id: LadderView; label: string }> = [
  { id: "active", label: "All open" },
  { id: "in_progress", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Finished" },
  { id: "mine", label: "Yours" },
];

const PLATFORMS = ["PC", "PS5", "Xbox", "Switch", "Mobile"];
const JOIN_MODES: Array<{ value: LadderJoinMode; label: string }> = [
  { value: "open", label: "Open" },
  { value: "approval", label: "Approval required" },
  { value: "hub_members", label: "Hub members only" },
  { value: "private", label: "Private" },
];
const HOSTS: Array<{ value: LadderHostType; label: string }> = [
  { value: "user", label: "Players" },
  { value: "team", label: "Teams" },
  { value: "hub", label: "Hubs" },
  { value: "gamerie", label: "Gamerie" },
];
/** URL keys for the filters behind the Filters button. */
const extraKeys = ["game", "platform", "region", "join", "host", "official"] as const;

export function LaddersPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("view") as LadderView | null;
  const view: LadderView = views.some((item) => item.id === requested) ? requested! : "active";
  const entry = (params.get("entry") as LadderEntrantType | null) ?? null;
  const [search, setSearch] = useState(params.get("q") ?? "");
  const term = useDebouncedValue(search.trim());
  const extra = Object.fromEntries(extraKeys.map((key) => [key, params.get(key) ?? ""])) as Record<(typeof extraKeys)[number], string>;
  const extraCount = extraKeys.filter((key) => extra[key]).length;
  const [moreOpen, setMoreOpen] = useState(extraCount > 0);
  const filters = useMemo<LadderFilters>(
    () => ({
      view,
      search: term || undefined,
      entrantType: entry ?? undefined,
      game: extra.game || undefined,
      platform: extra.platform || undefined,
      region: extra.region || undefined,
      joinMode: (extra.join as LadderJoinMode) || undefined,
      hostType: (extra.host as LadderHostType) || undefined,
      official: extra.official === "yes" || undefined,
    }),
    [entry, extra.game, extra.host, extra.join, extra.official, extra.platform, extra.region, term, view],
  );
  const query = useLadders(filters);
  const ladders = query.data?.pages.flatMap((page) => page.items) ?? [];

  const set = (key: string, value?: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  const clear = () => {
    setSearch("");
    setParams(
      (current) => {
        const next = new URLSearchParams();
        const kept = current.get("view");
        if (kept) next.set("view", kept);
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
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

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        title="Ladders"
        description="Season-long tables. Challenge anyone on the ladder, win to climb, and hold your place until the season ends."
        actions={
          <LinkButton to="/ladders/create" icon="plus">
            Start a ladder
          </LinkButton>
        }
      />

      <div className="grid gap-5">
        <Tabs label="Ladder views" items={views} value={view} onChange={(next) => set("view", next === "active" ? undefined : next)} indicatorId="ladder-view" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search ladders</span>
            <Icon name="search" className="pointer-events-none absolute inset-y-0 left-4 my-auto size-[1.1rem] text-mist-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or game"
              className={cn(inputClasses, "h-11 pl-11 text-sm")}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Segmented
              label="Entrants"
              value={entry ?? "any"}
              onChange={(value) => set("entry", value === "any" ? undefined : value)}
              options={[
                { value: "any", label: "Any" },
                { value: "player", label: "Solo" },
                { value: "team", label: "Teams" },
              ]}
            />
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls="ladder-filters"
              onClick={() => setMoreOpen((open) => !open)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm ring-1 ring-inset transition-colors",
                moreOpen || extraCount ? "text-mist-50 ring-lavender-400/40" : "text-mist-300 ring-white/10 hover:text-mist-50 hover:ring-white/20",
              )}
            >
              <Icon name="filters" className="size-4" />
              Filters
              {extraCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-lavender-400 text-[0.68rem] font-bold text-ink-950">{extraCount}</span>}
            </button>
          </div>
        </div>
        {moreOpen && (
          <div id="ladder-filters" className="flex flex-wrap items-center gap-2">
            <GameFilter value={extra.game} onChange={(value) => set("game", value || undefined)} />
            <FilterMenu label="Entry" value={extra.join} options={JOIN_MODES} onChange={(value) => set("join", value || undefined)} />
            <FilterMenu label="Platform" value={extra.platform} options={PLATFORMS} onChange={(value) => set("platform", value || undefined)} />
            <FilterMenu label="Region" value={extra.region} options={REGIONS} onChange={(value) => set("region", value || undefined)} />
            <FilterMenu label="Host" value={extra.host} options={HOSTS} onChange={(value) => set("host", value || undefined)} />
            <FilterMenu label="Official" value={extra.official} options={[{ value: "yes", label: "Official only" }]} anyLabel="All" onChange={(value) => set("official", value || undefined)} />
          </div>
        )}
        {(term || entry || extraCount > 0) && (
          <button type="button" onClick={clear} className="flex w-fit items-center gap-1.5 text-sm font-medium text-mist-400 hover:text-lavender-200">
            <Icon name="refresh" className="size-4" />
            Clear filters
          </button>
        )}
      </div>

      {query.isLoading ? (
        <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-88 rounded-card" />
          ))}
        </div>
      ) : query.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="Ladders didn't load"
          description={getApiErrorMessage(query.error, "Try again in a moment.")}
          action={
            <Button tone="outline" size="sm" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : ladders.length ? (
        <div className="grid gap-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ladders.map((ladder) => (
              <LadderCard key={ladder.id} ladder={ladder} />
            ))}
          </div>
          {query.hasNextPage && (
            <div className="flex justify-center">
              <Button tone="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
                {query.isFetchingNextPage ? "Loading…" : "Show more"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <StatePanel
          icon="ladders"
          title={term ? "Nothing matches that search" : view === "mine" ? "You're not on a ladder yet" : "No ladders here yet"}
          description={
            term ? "Try another name or game." : "Start one for your game, team or hub. Players challenge each other all season and the table updates itself."
          }
          action={
            term ? undefined : (
              <LinkButton to="/ladders/create" size="sm" icon="plus">
                Start a ladder
              </LinkButton>
            )
          }
        />
      )}
    </div>
  );
}
