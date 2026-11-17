import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { GameFilter } from "@/features/games/components/GameFilter";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { MyTournamentsList } from "./components/MyTournamentsList";
import { PhaseBadge, phaseOf } from "./components/PhaseBadge";
import { TournamentArt } from "./components/TournamentArt";
import { TournamentCard } from "./components/TournamentCard";
import { useMyTournaments, useTournamentFacets, useTournaments } from "./hooks";
import type { EntrantType, HostedFormat, SourceFilter, TournamentFilters, TournamentStatus } from "./types";
import { FORMAT_LABELS } from "./utils";

const statuses: Array<{ id: Exclude<TournamentStatus, "active">; label: string }> = [
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Live" },
  { id: "completed", label: "Finished" },
];
const sources: Array<{ value: "all" | Exclude<SourceFilter, "">; label: string }> = [
  { value: "all", label: "All" },
  { value: "gamerie", label: "On Gamerie" },
  { value: "official", label: "Official" },
  { value: "external", label: "Elsewhere" },
];
const formats = (Object.keys(FORMAT_LABELS) as HostedFormat[]).map((value) => ({ value, label: FORMAT_LABELS[value] }));
const prizes = [
  { value: "100", label: "$100+" },
  { value: "1000", label: "$1,000+" },
  { value: "5000", label: "$5,000+" },
  { value: "10000", label: "$10,000+" },
];
/** URL keys for the filters behind the Filters button. */
const extraKeys = ["format", "platform", "region", "level", "prize", "size"] as const;
const entries: Array<{ value: "any" | EntrantType; label: string }> = [
  { value: "any", label: "Any" },
  { value: "player", label: "Solo" },
  { value: "team", label: "Teams" },
];

function MyTournaments({ onSeeAll }: { onSeeAll: () => void }) {
  const query = useMyTournaments("all");
  const items = (query.data?.pages.flatMap((page) => page.data) ?? []).filter(
    (item) => !["completed", "cancelled"].includes(item.phase),
  );
  if (!items.length) return null;
  return (
    <section aria-labelledby="my-tournaments" className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="my-tournaments" className="type-label text-mist-500">
          Yours
        </h2>
        <button type="button" onClick={onSeeAll} className="text-sm font-medium text-mist-400 hover:text-lavender-200">
          See all
        </button>
      </div>
      <div className="relative -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
        {items.map((item) => {
          const [label, tone] = phaseOf({ phase: item.phase, status: undefined });
          return (
            <Link
              key={item.id}
              to={item.phase === "draft" ? `/tournaments/${item.id}/edit` : `/tournaments/${item.id}`}
              className="group flex w-72 shrink-0 snap-start items-center gap-3 rounded-2xl bg-ink-900/70 p-3 ring-1 ring-inset ring-white/6 transition-colors hover:ring-lavender-400/30"
            >
              <TournamentArt src={item.banner} game={item.game} className="size-14 shrink-0 rounded-xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold group-hover:text-lavender-100">{item.name}</span>
                <span className="mt-0.5 block truncate text-xs text-mist-400">
                  {item.isOrganizer ? "Hosting" : "Entered"} · {item.game}
                </span>
                <PhaseBadge label={label} tone={tone} className="mt-2 h-5 px-2 text-[0.6rem]" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function TournamentsPage() {
  const [params, setParams] = useSearchParams();
  const requestedStatus = params.get("status");
  const status = statuses.find((item) => item.id === requestedStatus)?.id ?? "upcoming";
  const mine = params.get("view") === "mine";
  const source = sources.find((item) => item.value === params.get("source"))?.value ?? "all";
  const entry = (entries.find((item) => item.value === params.get("entry"))?.value ?? "any") as "any" | EntrantType;
  const game = params.get("game") ?? "";
  const [search, setSearch] = useState(params.get("q") ?? "");
  const term = useDebouncedValue(search.trim());

  const extra = Object.fromEntries(extraKeys.map((key) => [key, params.get(key) ?? ""])) as Record<(typeof extraKeys)[number], string>;
  const extraCount = extraKeys.filter((key) => extra[key]).length + (game ? 1 : 0);
  const [moreOpen, setMoreOpen] = useState(extraCount > 0);
  const facets = useTournamentFacets();

  const filters = useMemo<TournamentFilters>(
    () => ({
      status,
      search: term || undefined,
      source: source === "all" ? "" : source,
      entrantType: entry === "any" ? undefined : entry,
      game: game || undefined,
      format: (extra.format as HostedFormat) || undefined,
      platform: extra.platform || undefined,
      region: extra.region || undefined,
      skillLevel: extra.level || undefined,
      prizeMin: Number(extra.prize) || undefined,
      teamSize: Number(extra.size) || undefined,
    }),
    [entry, extra.format, extra.level, extra.platform, extra.prize, extra.region, extra.size, game, source, status, term],
  );
  const query = useTournaments(filters);
  const tournaments = query.data?.pages.flatMap((page) => page.tournaments) ?? [];
  const filtered = Boolean(term || source !== "all" || entry !== "any" || extraCount);
  // Filters beyond the game, which has its own empty state.
  const narrowed = extraCount > (game ? 1 : 0);

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

  const clear = () => {
    setSearch("");
    setParams(
      (current) => {
        const next = new URLSearchParams();
        const kept = current.get("status");
        if (kept) next.set("status", kept);
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
        title="Tournaments"
        description="Brackets hosted on Gamerie, and the big events elsewhere. Every result from a Gamerie bracket goes on the players' records."
        actions={
          <LinkButton to="/tournaments/create" icon="plus">
            Host a tournament
          </LinkButton>
        }
      />

      {!mine && <MyTournaments onSeeAll={() => setParams({ view: "mine" })} />}

      <div className="grid gap-5">
        <Tabs
          label="Tournament views"
          items={[...statuses, { id: "mine" as const, label: "Yours" }]}
          value={mine ? "mine" : status}
          onChange={(value) => setParams(value === "mine" ? { view: "mine" } : value === "upcoming" ? {} : { status: value }, { replace: true })}
          indicatorId="tournament-status"
        />
        {!mine && (
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full gap-2 xl:max-w-md">
              <label className="relative block min-w-0 flex-1">
                <span className="sr-only">Search tournaments</span>
                <Icon name="search" className="pointer-events-none absolute inset-y-0 left-4 my-auto size-[1.1rem] text-mist-500" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or game"
                  className={cn(inputClasses, "h-11 pl-11 text-sm")}
                />
              </label>
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-controls="tournament-filters"
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
            <div className="flex flex-wrap gap-2">
              <Segmented label="Where" options={sources} value={source} onChange={(value) => setParam("source", value === "all" ? undefined : value)} />
              <Segmented label="Entry" options={entries} value={entry} onChange={(value) => setParam("entry", value === "any" ? undefined : value)} />
            </div>
          </div>
        )}
        {!mine && moreOpen && (
          <div id="tournament-filters" className="flex flex-wrap items-center gap-2">
            <GameFilter value={game} onChange={(value) => setParam("game", value || undefined)} />
            <FilterMenu label="Format" value={extra.format} options={formats} onChange={(value) => setParam("format", value || undefined)} />
            {facets.data?.platforms.length ? (
              <FilterMenu label="Platform" value={extra.platform} options={facets.data.platforms} onChange={(value) => setParam("platform", value || undefined)} />
            ) : null}
            {facets.data?.regions.length ? (
              <FilterMenu label="Region" value={extra.region} options={facets.data.regions} onChange={(value) => setParam("region", value || undefined)} />
            ) : null}
            {facets.data?.skillLevels.length ? (
              <FilterMenu label="Skill level" value={extra.level} options={facets.data.skillLevels} onChange={(value) => setParam("level", value || undefined)} />
            ) : null}
            <FilterMenu label="Prize pool" value={extra.prize} options={prizes} onChange={(value) => setParam("prize", value || undefined)} />
            {facets.data?.teamSizes.length ? (
              <FilterMenu
                label="Team size"
                value={extra.size}
                options={facets.data.teamSizes.map((size) => ({ value: String(size), label: size === 1 ? "Solo" : `${size} players` }))}
                onChange={(value) => setParam("size", value || undefined)}
              />
            ) : null}
          </div>
        )}
        {!mine && filtered && (
          <button type="button" onClick={clear} className="flex w-fit items-center gap-1.5 text-sm font-medium text-mist-400 hover:text-lavender-200">
            <Icon name="refresh" className="size-4" />
            Clear filters
          </button>
        )}
      </div>

      {mine ? (
        <MyTournamentsList />
      ) : query.isLoading ? (
        <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-88 rounded-card" />
          ))}
        </div>
      ) : query.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="Tournaments didn't load"
          description={getApiErrorMessage(query.error, "Gamerie couldn't load tournaments.")}
          action={
            <Button tone="outline" size="sm" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : tournaments.length ? (
        <div className="grid gap-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
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
          icon="trophy"
          title={term ? "Nothing matches that search" : narrowed ? "Nothing matches those filters" : status === "ongoing" ? "Nothing live right now" : game ? `No ${game} tournaments here yet` : "No tournaments here yet"}
          description={
            term
              ? "Try another name or game."
              : narrowed
                ? "Loosen a filter or clear them to see more."
                : "Host one for your friends, team or hub. Gamerie runs the bracket, the check-in and the results."
          }
          action={
            narrowed ? (
              <Button tone="outline" size="sm" icon="refresh" onClick={clear}>
                Clear filters
              </Button>
            ) : term ? undefined : (
              <LinkButton to="/tournaments/create" size="sm" icon="plus">
                Host a tournament
              </LinkButton>
            )
          }
        />
      )}
    </div>
  );
}
