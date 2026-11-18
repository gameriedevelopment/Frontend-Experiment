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
import { LeagueCard } from "./components/LeagueCard";
import { useLeagueHostingOptions, useLeagues } from "./hooks";
import type { LeagueEntrantType, LeagueFilters, LeagueHostType, LeagueJoinMode, LeagueView } from "./types";

const views: Array<{ id: LeagueView; label: string }> = [
  { id: "active", label: "All open" },
  { id: "in_progress", label: "Live" },
  { id: "upcoming", label: "Registration" },
  { id: "completed", label: "Finished" },
  { id: "mine", label: "Yours" },
];

const PLATFORMS = ["PC", "PS5", "Xbox", "Switch", "Mobile"];
const JOIN_MODES: Array<{ value: LeagueJoinMode; label: string }> = [
  { value: "open", label: "Open" },
  { value: "approval", label: "Approval required" },
  { value: "hub_members", label: "Hub members only" },
  { value: "private", label: "Invite only" },
];
const HOSTS: Array<{ value: LeagueHostType; label: string }> = [
  { value: "hub", label: "Hubs" },
  { value: "gamerie", label: "Gamerie" },
];
/** URL keys for the filters behind the Filters button. */
const extraKeys = ["game", "platform", "region", "join", "host"] as const;

export function LeaguesPage() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("view") as LeagueView | null;
  const view: LeagueView = views.some((item) => item.id === requested) ? requested! : "active";
  const entry = (params.get("entry") as LeagueEntrantType | null) ?? null;
  const [search, setSearch] = useState(params.get("q") ?? "");
  const term = useDebouncedValue(search.trim());
  const extra = Object.fromEntries(extraKeys.map((key) => [key, params.get(key) ?? ""])) as Record<(typeof extraKeys)[number], string>;
  const extraCount = extraKeys.filter((key) => extra[key]).length;
  const [moreOpen, setMoreOpen] = useState(extraCount > 0);
  const hosting = useLeagueHostingOptions();
  const canCreate = Boolean(hosting.data?.canCreate && !hosting.data.creationLocked);
  const filters = useMemo<LeagueFilters>(
    () => ({
      view,
      search: term || undefined,
      entrantType: entry ?? undefined,
      game: extra.game || undefined,
      platform: extra.platform || undefined,
      region: extra.region || undefined,
      joinMode: (extra.join as LeagueJoinMode) || undefined,
      hostType: (extra.host as LeagueHostType) || undefined,
    }),
    [entry, extra.game, extra.host, extra.join, extra.platform, extra.region, term, view],
  );
  const query = useLeagues(filters);
  const leagues = query.data?.pages.flatMap((page) => page.items) ?? [];

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

  const createButton = canCreate ? (
    <LinkButton to="/leagues/create" icon="plus">
      Start a league
    </LinkButton>
  ) : undefined;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        title="Leagues"
        description="Seasons on a fixed weekly schedule. Everyone plays everyone, the table decides the playoffs, and every season ends with a champion."
        actions={createButton}
      />

      <div className="grid gap-5">
        <Tabs label="League views" items={views} value={view} onChange={(next) => set("view", next === "active" ? undefined : next)} indicatorId="league-view" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search leagues</span>
            <Icon name="search" className="pointer-events-none absolute inset-y-0 left-4 my-auto size-[1.1rem] text-mist-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, game or host"
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
              aria-controls="league-filters"
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
          <div id="league-filters" className="flex flex-wrap items-center gap-2">
            <GameFilter value={extra.game} onChange={(value) => set("game", value || undefined)} />
            <FilterMenu label="Entry" value={extra.join} options={JOIN_MODES} onChange={(value) => set("join", value || undefined)} />
            <FilterMenu label="Platform" value={extra.platform} options={PLATFORMS} onChange={(value) => set("platform", value || undefined)} />
            <FilterMenu label="Region" value={extra.region} options={REGIONS} onChange={(value) => set("region", value || undefined)} />
            <FilterMenu label="Host" value={extra.host} options={HOSTS} onChange={(value) => set("host", value || undefined)} />
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
          title="Leagues didn't load"
          description={getApiErrorMessage(query.error, "Try again in a moment.")}
          action={
            <Button tone="outline" size="sm" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : leagues.length ? (
        <div className="grid gap-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {leagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
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
          icon="leagues"
          title={term ? "Nothing matches that search" : view === "mine" ? "You're not in a league yet" : "No leagues here yet"}
          description={
            term
              ? "Try another name, game or host."
              : canCreate
                ? "Run one from your hub: pick the weeks, set match night and let the schedule build itself."
                : "Leagues are run by hubs and by Gamerie. Join a hub that runs one, or check back when the next season opens."
          }
          action={term ? undefined : createButton && <LinkButton to="/leagues/create" size="sm" icon="plus">Start a league</LinkButton>}
        />
      )}
    </div>
  );
}
