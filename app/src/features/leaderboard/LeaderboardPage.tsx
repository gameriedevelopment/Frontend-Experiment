import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { useLadderLeaderboard } from "@/features/ladders/hooks";
import { useLeagueLeaderboard } from "@/features/leagues/hooks";
import { Pagination } from "@/components/ui/Pagination";
import { useAuthStore } from "@/features/auth/authStore";
import { useGameOptions } from "@/features/games/hooks";
import { EntrantMark } from "@/features/tournaments/components/EntrantMark";
import { useTournamentLeaderboard } from "@/features/tournaments/hooks";
import { ordinal } from "@/features/tournaments/utils";
import { cn } from "@/lib/cn";
import { playerPath, teamPath } from "@/lib/paths";
import { getApiErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useLeaderboard } from "./hooks";
import type { LeaderboardEntity, LeaderboardEntityType, LeaderboardMetric } from "./types";
import {
  formatMetricValue,
  leaderboardImage,
  leaderboardMetrics,
  leaderboardName,
  leaderboardPath,
  leaderboardSubtitle,
} from "./utils";

// Record metrics rank overall results; competition boards rank placings in Gamerie events.
type Competition = "tournaments" | "ladders" | "leagues";
type View = LeaderboardMetric | Competition;
const views: Array<TabItem<View>> = [
  ...leaderboardMetrics.map((metric) => ({ id: metric.value as View, label: metric.shortLabel })),
  { id: "tournaments", label: "Tournaments", dividerBefore: true },
  { id: "ladders", label: "Ladders" },
  { id: "leagues", label: "Leagues" },
];
const isCompetition = (view: View): view is Competition => view === "tournaments" || view === "ladders" || view === "leagues";
const limit = 20;

function Podium({ entities, metric, me }: { entities: LeaderboardEntity[]; metric: LeaderboardMetric; me?: string }) {
  const order = [1, 0, 2].filter((index) => entities[index]);
  const metricLabel = leaderboardMetrics.find((item) => item.value === metric)?.label ?? "";
  return (
    <section aria-label="Top three" className="grid grid-cols-3 items-end gap-2 sm:gap-4">
      {order.map((index) => {
        const entity = entities[index];
        const place = index + 1;
        const first = place === 1;
        return (
          <Link
            key={entity.id}
            to={leaderboardPath(entity)}
            className={cn(
              "group relative grid justify-items-center overflow-hidden rounded-card px-3 pb-5 text-center ring-1 ring-inset transition-colors sm:px-5",
              first ? "bg-ink-900 pt-8 ring-signal/30 sm:pt-10" : "bg-ink-900/60 pt-6 ring-white/8 hover:ring-white/20",
              entity.id === me && "ring-lavender-400/60",
            )}
          >
            {first && <div className="halftone absolute inset-0 text-signal/10 mask-[radial-gradient(60%_70%_at_50%_0%,black,transparent)]" />}
            <span className={cn("type-label relative flex items-center gap-1.5", first ? "text-signal" : "text-mist-500")}>
              {first && <Icon name="crown" weight="fill" className="size-3.5" />}
              {ordinal(place)}
            </span>
            <Avatar
              src={leaderboardImage(entity)}
              name={leaderboardName(entity)}
              size={first ? "lg" : "md"}
              tone={entity.entityType === "teams" ? "ink" : "brand"}
              className={cn("relative mt-4 rounded-full", first && "ring-4 ring-signal/40")}
            />
            <span className="relative mt-3 w-full truncate text-sm font-semibold group-hover:text-lavender-200 sm:text-base">{leaderboardName(entity)}</span>
            <span className="relative hidden w-full truncate text-xs text-mist-500 sm:block">{leaderboardSubtitle(entity)}</span>
            <span className={cn("type-display relative mt-4 tabular-nums leading-none", first ? "text-3xl text-signal sm:text-4xl" : "text-2xl")}>
              {formatMetricValue(entity, metric)}
            </span>
            <span className="type-label relative mt-1.5 text-mist-500">{metricLabel}</span>
          </Link>
        );
      })}
    </section>
  );
}

function Row({ entity, rank, metric, me }: { entity: LeaderboardEntity; rank: number; metric: LeaderboardMetric; me?: string }) {
  const stats = entity.stats;
  return (
    <li>
      <Link
        to={leaderboardPath(entity)}
        className={cn(
          "group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/3 sm:grid-cols-[3rem_minmax(0,1fr)_8rem_6rem_6rem] sm:gap-4",
          entity.id === me && "bg-lavender-400/8 ring-1 ring-inset ring-lavender-400/30",
        )}
      >
        <span className="type-display text-center text-lg tabular-nums text-mist-400">{rank}</span>
        <span className="flex min-w-0 items-center gap-3">
          <Avatar src={leaderboardImage(entity)} name={leaderboardName(entity)} tone={entity.entityType === "teams" ? "ink" : "brand"} className="rounded-full" />
          <span className="min-w-0">
            <span className="flex items-center gap-2 truncate text-sm font-semibold group-hover:text-lavender-200">
              {leaderboardName(entity)}
              {entity.id === me && <span className="type-label text-lavender-300">You</span>}
            </span>
            <span className="block truncate text-xs text-mist-500">
              {[leaderboardSubtitle(entity), entity.region, entity.games[0]?.name].filter(Boolean).join(" · ")}
            </span>
          </span>
        </span>
        <span className="hidden text-right text-sm tabular-nums text-mist-300 sm:block">
          {stats.wins}–{stats.losses}
          {stats.draws ? `–${stats.draws}` : ""}
        </span>
        <span className="hidden text-right text-sm tabular-nums text-mist-300 sm:block">{Math.round(stats.winRate ?? 0)}%</span>
        <span className="type-display text-right text-lg tabular-nums">{formatMetricValue(entity, metric)}</span>
      </Link>
    </li>
  );
}

function TournamentPoints({ kind, game }: { kind: "player" | "team"; game?: string }) {
  const query = useTournamentLeaderboard(kind, game);
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];
  if (query.isLoading) return <Skeleton className="h-96 rounded-card" />;
  if (query.isError)
    return <StatePanel icon="warning" tone="danger" title="Tournament standings didn't load" description={getApiErrorMessage(query.error, "Try again in a moment.")} />;
  if (!rows.length)
    return <StatePanel icon="trophy" title="No tournament results yet" description="Finish a tournament on Gamerie and its placings start this table." />;
  return (
    <div className="relative overflow-x-auto rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
      <table className="w-full min-w-128 text-sm">
        <thead>
          <tr className="type-label text-left text-mist-500">
            <th scope="col" className="px-5 py-4 font-medium">#</th>
            <th scope="col" className="w-full px-2 py-4 font-medium">{kind === "team" ? "Team" : "Player"}</th>
            {["Points", "Titles", "Podiums", "Best", "Played"].map((label) => (
              <th key={label} scope="col" className="px-3 py-4 text-right font-medium last:pr-5">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-white/6">
              <td className={cn("px-5 py-3 font-semibold tabular-nums", row.rank === 1 ? "text-signal" : row.rank <= 3 ? "text-lavender-300" : "text-mist-400")}>{row.rank}</td>
              <th scope="row" className="px-2 py-3 text-left font-normal">
                <Link to={kind === "team" ? teamPath(row.id) : playerPath(row.name ?? row.id)} className="flex w-fit max-w-full items-center gap-2.5 transition-colors hover:text-lavender-200">
                  <EntrantMark name={row.name} src={row.avatar} size="sm" className={kind === "player" ? "rounded-full" : undefined} />
                  <span className="truncate font-semibold">{row.name ?? "Unknown"}</span>
                </Link>
              </th>
              <td className="px-3 py-3 text-right font-semibold tabular-nums">{row.points}</td>
              <td className="px-3 py-3 text-right tabular-nums text-mist-300">{row.wins}</td>
              <td className="px-3 py-3 text-right tabular-nums text-mist-300">{row.podiums}</td>
              <td className="px-3 py-3 text-right tabular-nums text-mist-300">{row.bestPlacement ? ordinal(row.bestPlacement) : "—"}</td>
              <td className="px-3 py-3 pr-5 text-right tabular-nums text-mist-300">{row.played}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {query.hasNextPage && (
        <div className="flex justify-center border-t border-white/6 p-4">
          <Button tone="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
            {query.isFetchingNextPage ? "Loading…" : "Show more"}
          </Button>
        </div>
      )}
    </div>
  );
}

function LadderPoints({ kind, game }: { kind: "player" | "team"; game?: string }) {
  const query = useLadderLeaderboard(kind, game);
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];
  if (query.isLoading) return <Skeleton className="h-96 rounded-card" />;
  if (query.isError)
    return <StatePanel icon="warning" tone="danger" title="Ladder standings didn't load" description={getApiErrorMessage(query.error, "Try again in a moment.")} />;
  if (!rows.length)
    return <StatePanel icon="ladders" title="No ladder results yet" description={game ? `Play a ${game} ladder match on Gamerie to appear here.` : "Results from ladders run on Gamerie fill this table."} />;
  return (
    <div className="grid gap-3">
      <p className="text-sm text-mist-400">
        Points per finished ladder: 100 for 1st, 70 for 2nd, 50 for 3rd, 40 for 4th, 25 for the top 8, 10 for finishing. Ladders still running count
        through their match record.
      </p>
      <div className="relative overflow-x-auto rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
        <table className="w-full min-w-136 text-sm">
          <thead>
            <tr className="type-label text-left text-mist-500">
              <th scope="col" className="px-5 py-4 font-medium">#</th>
              <th scope="col" className="w-full px-2 py-4 font-medium">{kind === "team" ? "Team" : "Player"}</th>
              {["Points", "Titles", "Podiums", "Best", "Record", "Ladders"].map((label) => (
                <th key={label} scope="col" className="px-3 py-4 text-right font-medium last:pr-5">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-white/6">
                <td className={cn("px-5 py-3 font-semibold tabular-nums", row.rank === 1 ? "text-signal" : row.rank <= 3 ? "text-lavender-300" : "text-mist-400")}>{row.rank}</td>
                <th scope="row" className="px-2 py-3 text-left font-normal">
                  <Link to={kind === "team" ? teamPath(row.id) : playerPath(row.name ?? row.id)} className="flex w-fit max-w-full items-center gap-2.5 transition-colors hover:text-lavender-200">
                    <EntrantMark name={row.name} src={row.avatar} size="sm" className={kind === "player" ? "rounded-full" : undefined} />
                    <span className="truncate font-semibold">{row.name ?? "Unknown"}</span>
                  </Link>
                </th>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{row.points}</td>
                <td className="px-3 py-3 text-right tabular-nums text-mist-300">{row.titles}</td>
                <td className="px-3 py-3 text-right tabular-nums text-mist-300">{row.podiums}</td>
                <td className="px-3 py-3 text-right tabular-nums text-mist-300">{row.bestPlacement ? ordinal(row.bestPlacement) : "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-mist-300" title="Wins, draws and losses">
                  {row.matchWins}–{row.matchDraws}–{row.matchLosses}
                </td>
                <td className="px-3 py-3 pr-5 text-right tabular-nums text-mist-300">{row.ladders}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {query.hasNextPage && (
          <div className="flex justify-center border-t border-white/6 p-4">
            <Button tone="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
              {query.isFetchingNextPage ? "Loading…" : "Show more"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaguePoints({ kind, game }: { kind: "player" | "team"; game?: string }) {
  const query = useLeagueLeaderboard(kind, game);
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];
  if (query.isLoading) return <Skeleton className="h-96 rounded-card" />;
  if (query.isError)
    return <StatePanel icon="warning" tone="danger" title="League standings didn't load" description={getApiErrorMessage(query.error, "Try again in a moment.")} />;
  if (!rows.length)
    return <StatePanel icon="leagues" title="No finished league seasons yet" description={game ? `Finish a ${game} league season on Gamerie to appear here.` : "Every league season that finishes on Gamerie adds to this table."} />;
  return (
    <div className="grid gap-3">
      <p className="text-sm text-mist-400">Points per finished season: 100 for the title, 70 for 2nd, 50 for 3rd, 40 for 4th, 25 for the top 8 and 10 for finishing.</p>
      <div className="relative overflow-x-auto rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
        <table className="w-full min-w-136 text-sm">
          <thead>
            <tr className="type-label text-left text-mist-500">
              <th scope="col" className="px-5 py-4 font-medium">#</th>
              <th scope="col" className="w-full px-2 py-4 font-medium">{kind === "team" ? "Team" : "Player"}</th>
              {["Points", "Titles", "Podiums", "Best", "Record", "Seasons"].map((label) => (
                <th key={label} scope="col" className="px-3 py-4 text-right font-medium last:pr-5">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-white/6">
                <td className={cn("px-5 py-3 font-semibold tabular-nums", row.rank === 1 ? "text-signal" : row.rank <= 3 ? "text-lavender-300" : "text-mist-400")}>{row.rank}</td>
                <th scope="row" className="px-2 py-3 text-left font-normal">
                  <Link to={kind === "team" ? teamPath(row.id) : playerPath(row.id)} className="flex w-fit max-w-full items-center gap-2.5 transition-colors hover:text-lavender-200">
                    <EntrantMark name={row.name} src={row.avatar} size="sm" className={kind === "player" ? "rounded-full" : undefined} />
                    <span className="truncate font-semibold">{row.name ?? "Unknown"}</span>
                  </Link>
                </th>
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{row.score}</td>
                <td className="px-3 py-3 text-right tabular-nums text-mist-300">{row.titles}</td>
                <td className="px-3 py-3 text-right tabular-nums text-mist-300">{row.podiums}</td>
                <td className="px-3 py-3 text-right tabular-nums text-mist-300">{row.best ? ordinal(row.best) : "—"}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-mist-300" title="Wins, draws and losses">
                  {row.record.won}–{row.record.drawn}–{row.record.lost}
                </td>
                <td className="px-3 py-3 pr-5 text-right tabular-nums text-mist-300">{row.seasons}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {query.hasNextPage && (
          <div className="flex justify-center border-t border-white/6 p-4">
            <Button tone="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
              {query.isFetchingNextPage ? "Loading…" : "Show more"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function LeaderboardPage() {
  const user = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const type: LeaderboardEntityType = params.get("type") === "teams" ? "teams" : "users";
  const requestedView = (
    ["tournaments", "ladders", "leagues"].includes(params.get("view") ?? "") ? params.get("view") : params.get("metric")
  ) as View | null;
  const view: View = views.some((item) => item.id === requestedView) ? requestedView! : "ranking";
  const metric: LeaderboardMetric = isCompetition(view) ? "ranking" : view;
  const game = params.get("game") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [gameQuery, setGameQuery] = useState("");
  const games = useGameOptions(useDebouncedValue(gameQuery), true);
  const gameOptions = useMemo<ComboboxOption[]>(
    () => (games.data?.data ?? []).map((item) => ({ value: item.name, label: item.name, description: item.gameType })),
    [games.data],
  );
  const filters = useMemo(() => ({ type, metric, game: game || undefined }), [game, metric, type]);
  const query = useLeaderboard(filters, page, !isCompetition(view));
  const entities = query.data?.data ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const podium = page === 1 && entities.length >= 3 ? entities.slice(0, 3) : [];
  const listed = podium.length ? entities.slice(3) : entities;
  const offset = (page - 1) * limit + podium.length;

  const update = (changes: Record<string, string | undefined>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
        if (!("page" in changes)) next.delete("page");
        return next;
      },
      { replace: true },
    );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        title="Leaderboard"
        description="Ranked from recorded results only: challenges, tournaments and verified matches. Nothing self-reported counts."
      />

      <div className="grid gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <Segmented
            label="Rank"
            value={type}
            onChange={(value) => update({ type: value === "users" ? undefined : value })}
            options={[
              { value: "users", label: "Players" },
              { value: "teams", label: "Teams" },
            ]}
            className="w-fit"
          />
          <div className="w-full lg:max-w-xs">
            <Combobox
              browse
              browseLabel="Popular games"
              id="leaderboard-game"
              label="Game"
              placeholder="All games"
              query={gameQuery}
              onQueryChange={setGameQuery}
              options={gameOptions}
              loading={games.isFetching}
              value={game ? { value: game, label: game } : null}
              onChange={(option) => update({ game: option?.value })}
            />
          </div>
        </div>
        <Tabs
          label="Ranked by"
          items={views}
          value={view}
          onChange={(next) =>
            isCompetition(next)
              ? update({ view: next, metric: undefined })
              : update({ view: undefined, metric: next === "ranking" ? undefined : next })
          }
          indicatorId="leaderboard-view"
        />
      </div>

      {view === "tournaments" ? (
        <TournamentPoints kind={type === "teams" ? "team" : "player"} game={game || undefined} />
      ) : view === "ladders" ? (
        <LadderPoints kind={type === "teams" ? "team" : "player"} game={game || undefined} />
      ) : view === "leagues" ? (
        <LeaguePoints kind={type === "teams" ? "team" : "player"} game={game || undefined} />
      ) : query.isLoading ? (
        <div aria-hidden="true" className="grid gap-4">
          <div className="grid grid-cols-3 items-end gap-4">
            <Skeleton className="h-56 rounded-card" />
            <Skeleton className="h-64 rounded-card" />
            <Skeleton className="h-52 rounded-card" />
          </div>
          <Skeleton className="h-96 rounded-card" />
        </div>
      ) : query.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="The leaderboard didn't load"
          description={getApiErrorMessage(query.error, "Try again in a moment.")}
          action={
            <Button tone="outline" size="sm" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : entities.length ? (
        <div className={cn("grid gap-6 transition-opacity", query.isPlaceholderData && "opacity-60")}>
          {podium.length > 0 && <Podium entities={podium} metric={metric} me={user?.id} />}
          {listed.length > 0 && (
            <section className="rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6 sm:p-3">
              <div className="type-label hidden grid-cols-[3rem_minmax(0,1fr)_8rem_6rem_6rem] gap-4 px-3 pb-2 pt-1 text-mist-500 sm:grid">
                <span className="text-center">#</span>
                <span>{type === "teams" ? "Team" : "Player"}</span>
                <span className="text-right">Record</span>
                <span className="text-right">Win rate</span>
                <span className="text-right">{leaderboardMetrics.find((item) => item.value === metric)?.shortLabel}</span>
              </div>
              <ol>
                {listed.map((entity, index) => (
                  <Row key={entity.id} entity={entity} rank={offset + index + 1} metric={metric} me={user?.id} />
                ))}
              </ol>
            </section>
          )}
          <Pagination page={page} totalPages={totalPages} onPage={(next) => update({ page: next === 1 ? undefined : String(next) })} />
        </div>
      ) : (
        <StatePanel
          icon="leaderboard"
          title={game ? `No ranked ${type === "teams" ? "teams" : "players"} for ${game} yet` : "No rankings yet"}
          description="Rankings fill in as challenges, tournaments and verified matches are recorded."
        />
      )}
    </div>
  );
}
