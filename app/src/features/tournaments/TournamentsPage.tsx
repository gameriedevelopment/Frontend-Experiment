import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
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
import { useMyTournaments, useTournaments } from "./hooks";
import type { EntrantType, SourceFilter, TournamentFilters, TournamentStatus } from "./types";

const statuses: Array<{ id: Exclude<TournamentStatus, "active">; label: string }> = [
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Live" },
  { id: "completed", label: "Finished" },
];
const sources: Array<{ value: "all" | Exclude<SourceFilter, "" | "official">; label: string }> = [
  { value: "all", label: "All" },
  { value: "gamerie", label: "On Gamerie" },
  { value: "external", label: "Elsewhere" },
];
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
  const source = (sources.find((item) => item.value === params.get("source"))?.value ?? "all") as
    | "all"
    | "gamerie"
    | "external";
  const entry = (entries.find((item) => item.value === params.get("entry"))?.value ?? "any") as "any" | EntrantType;
  const game = params.get("game") ?? "";
  const [search, setSearch] = useState(params.get("q") ?? "");
  const term = useDebouncedValue(search.trim());

  const filters = useMemo<TournamentFilters>(
    () => ({
      status,
      search: term || undefined,
      source: source === "all" ? "" : source,
      entrantType: entry === "any" ? undefined : entry,
      game: game || undefined,
    }),
    [entry, game, source, status, term],
  );
  const query = useTournaments(filters);
  const tournaments = query.data?.pages.flatMap((page) => page.tournaments) ?? [];

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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search tournaments</span>
            <Icon
              name="search"
              className="pointer-events-none absolute inset-y-0 left-4 my-auto size-[1.1rem] text-mist-500"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or game"
              className={cn(inputClasses, "h-11 pl-11 text-sm")}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <GameFilter value={game} onChange={(value) => setParam("game", value || undefined)} />
            <Segmented
              label="Where"
              options={sources}
              value={source}
              onChange={(value) => setParam("source", value === "all" ? undefined : value)}
            />
            <Segmented
              label="Entry"
              options={entries}
              value={entry}
              onChange={(value) => setParam("entry", value === "any" ? undefined : value)}
            />
          </div>
        </div>
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
          title={term ? "Nothing matches that search" : status === "ongoing" ? "Nothing live right now" : game ? `No ${game} tournaments here yet` : "No tournaments here yet"}
          description={
            term
              ? "Try another name or game."
              : "Host one for your friends, team or hub. Gamerie runs the bracket, the check-in and the results."
          }
          action={
            term ? undefined : (
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
