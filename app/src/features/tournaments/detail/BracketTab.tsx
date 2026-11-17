import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { EntrantMark } from "../components/EntrantMark";
import { Podium } from "../components/Podium";
import { useTournamentBracket } from "../hooks";
import type { BracketEntrant, BracketMatch, HostedTournamentDetail, StandingRow, TournamentBracket } from "../types";
import { eliminationLanes, matchTone, pathOf, type LaneColumn } from "./bracketLayout";

type Entrants = Map<string, BracketEntrant>;

function SideRow({
  match,
  side,
  entrants,
  onHover,
}: {
  match: BracketMatch;
  side: "a" | "b";
  entrants: Entrants;
  onHover: (id: string | null) => void;
}) {
  const data = side === "a" ? match.sideA : match.sideB;
  const entrant = data.entrantId ? entrants.get(data.entrantId) : undefined;
  const won = Boolean(match.winnerEntrantId) && match.winnerEntrantId === data.entrantId;
  const lost = Boolean(match.winnerEntrantId) && !won;
  const score =
    match.status === "completed"
      ? data.score
      : side === "a"
        ? match.challenge?.provisional?.scoreA
        : match.challenge?.provisional?.scoreB;
  return (
    <div
      onMouseEnter={() => onHover(data.entrantId)}
      onMouseLeave={() => onHover(null)}
      className={cn("flex h-9 items-center gap-2 px-2.5", lost && "text-mist-500")}
    >
      {entrant ? (
        <EntrantMark name={entrant.name} src={entrant.avatar} size="xs" />
      ) : (
        <span className="size-6 shrink-0 rounded-md border border-dashed border-white/12" />
      )}
      <span className={cn("min-w-0 flex-1 truncate text-[0.82rem]", won ? "font-semibold text-mist-50" : "font-medium")}>
        {entrant?.name ?? (data.state === "empty" ? "Bye" : "To be decided")}
      </span>
      {entrant?.seed && <span className="text-[0.65rem] tabular-nums text-mist-500">{entrant.seed}</span>}
      <span
        className={cn(
          "grid h-6 min-w-6 place-items-center rounded-md px-1 text-xs font-semibold tabular-nums",
          won ? "bg-lavender-400 text-ink-950" : "bg-white/5 text-mist-400",
        )}
      >
        {score ?? "–"}
      </span>
    </div>
  );
}

function MatchCard({
  match,
  entrants,
  mine,
  dimmed,
  highlighted,
  onHover,
  onOpen,
}: {
  match: BracketMatch;
  entrants: Entrants;
  mine: boolean;
  dimmed: boolean;
  highlighted: boolean;
  onHover: (id: string | null) => void;
  onOpen: () => void;
}) {
  const tone = matchTone(match);
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Match ${match.number}, ${match.label}`}
      className={cn(
        "w-56 overflow-hidden rounded-xl bg-ink-900 text-left ring-1 ring-inset transition-[opacity,box-shadow] duration-300",
        highlighted ? "ring-lavender-400/70" : mine ? "ring-lavender-400/40" : "ring-white/8 hover:ring-white/20",
        dimmed && "opacity-35",
        tone === "bye" && "opacity-50",
      )}
    >
      <span className="flex items-center justify-between border-b border-white/6 px-2.5 py-1.5">
        <span className="type-label text-mist-500">#{match.number}</span>
        {tone === "live" ? (
          <span className="type-label flex items-center gap-1.5 text-signal">
            <span className="size-1.5 animate-pulse rounded-full bg-signal motion-reduce:animate-none" />
            Live
          </span>
        ) : tone === "pending" ? (
          <span className="type-label text-lavender-300">Result pending</span>
        ) : tone === "disputed" ? (
          <span className="type-label text-danger">Reported</span>
        ) : match.scheduledAt && tone === "upcoming" ? (
          <span className="type-label text-mist-500">
            {new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }).format(
              new Date(match.scheduledAt),
            )}
          </span>
        ) : null}
      </span>
      <SideRow match={match} side="a" entrants={entrants} onHover={onHover} />
      <span className="block h-px bg-white/5" />
      <SideRow match={match} side="b" entrants={entrants} onHover={onHover} />
    </button>
  );
}

function Lane({
  title,
  columns,
  render,
}: {
  title: string | null;
  columns: LaneColumn[];
  render: (match: BracketMatch) => ReactNode;
}) {
  return (
    <section className="grid gap-4">
      {title && <h3 className="type-label text-mist-500">{title}</h3>}
      <div className="relative -mx-4 overflow-x-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-white/12 scrollbar-track-transparent sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-10">
          {columns.map((column, index) => {
            const next = columns[index + 1];
            const merges = Boolean(next) && column.matches.length > 1 && next.matches.length * 2 === column.matches.length;
            const slots = merges
              ? Array.from({ length: column.matches.length / 2 }, (_, pair) => column.matches.slice(pair * 2, pair * 2 + 2))
              : column.matches.map((match) => [match]);
            return (
              <div key={`${column.round}-${column.label}`} className="flex w-56 flex-col">
                <p className="mb-4 flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{column.label}</span>
                  <span className="type-label shrink-0 text-mist-500">Bo{column.bestOf}</span>
                </p>
                <div className="flex flex-1 flex-col justify-around">
                  {slots.map((slot) => (
                    <div key={slot[0].id} className="relative flex flex-1 flex-col justify-around gap-4 py-3">
                      {slot.map(render)}
                      {next && slot.length === 2 && (
                        <>
                          <span
                            aria-hidden="true"
                            className="absolute -right-5 bottom-1/4 top-1/4 w-5 rounded-r-lg border-y border-r border-white/12"
                          />
                          <span aria-hidden="true" className="absolute -right-10 top-1/2 w-5 border-t border-white/12" />
                        </>
                      )}
                      {next && slot.length === 1 && (
                        <span aria-hidden="true" className="absolute -right-10 top-1/2 w-10 border-t border-white/12" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Standings({ rows, entrants, myEntrantId }: { rows: StandingRow[]; entrants: Entrants; myEntrantId?: string }) {
  return (
    <div className="relative overflow-x-auto rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
      <table className="w-full min-w-136 text-sm">
        <thead>
          <tr className="type-label text-left text-mist-500">
            <th className="px-5 py-3.5 font-medium">#</th>
            <th className="w-full px-2 py-3.5 font-medium">Entrant</th>
            {["P", "W", "D", "L", "GD", "Pts"].map((label) => (
              <th key={label} className="px-3 py-3.5 text-right font-medium last:pr-5">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const entrant = entrants.get(row.entrantId);
            return (
              <tr
                key={row.entrantId}
                className={cn("border-t border-white/6", row.entrantId === myEntrantId && "bg-lavender-400/6")}
              >
                <td className={cn("px-5 py-3 font-semibold tabular-nums", row.rank === 1 ? "text-signal" : "text-mist-400")}>
                  {row.rank}
                  {row.tied ? "=" : ""}
                </td>
                <td className="px-2 py-3">
                  <span className="flex items-center gap-2.5">
                    <EntrantMark name={entrant?.name} src={entrant?.avatar} size="xs" />
                    <span className="truncate font-medium">{entrant?.name ?? "Unknown"}</span>
                  </span>
                </td>
                {[row.played, row.won, row.drawn, row.lost, row.gameDifference > 0 ? `+${row.gameDifference}` : row.gameDifference].map(
                  (value, index) => (
                    <td key={index} className="px-3 py-3 text-right tabular-nums text-mist-300">
                      {value}
                    </td>
                  ),
                )}
                <td className="px-3 py-3 pr-5 text-right font-semibold tabular-nums">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RoundRobin({ bracket, myEntrantId }: { bracket: TournamentBracket; myEntrantId?: string }) {
  const entrants = new Map(bracket.entrants.map((entrant) => [entrant.id, entrant]));
  const groups = new Map<number, StandingRow[]>();
  for (const row of bracket.standings ?? []) groups.set(row.groupIndex, [...(groups.get(row.groupIndex) ?? []), row]);
  return (
    <div className="grid gap-6">
      {[...groups.entries()].map(([index, rows]) => (
        <section key={index} className="grid gap-3">
          {groups.size > 1 && <h3 className="type-label text-mist-500">Group {String.fromCharCode(65 + index)}</h3>}
          <Standings rows={rows.sort((a, b) => a.rank - b.rank)} entrants={entrants} myEntrantId={myEntrantId} />
        </section>
      ))}
    </div>
  );
}

export function BracketTab({
  tournament,
  onOpenMatch,
}: {
  tournament: HostedTournamentDetail;
  onOpenMatch: (matchId: string) => void;
}) {
  const started = ["live", "paused", "completed", "cancelled"].includes(tournament.phase);
  const query = useTournamentBracket(tournament.id, started, tournament.phase === "live");
  const [hovered, setHovered] = useState<string | null>(null);
  const myEntrantId = tournament.viewer.entrant?.id;
  const bracket = query.data;
  const entrants = useMemo(() => new Map((bracket?.entrants ?? []).map((entrant) => [entrant.id, entrant])), [bracket?.entrants]);
  const path = useMemo(() => pathOf(bracket?.matches ?? [], hovered), [bracket?.matches, hovered]);

  if (!started) {
    return (
      <StatePanel
        icon="bracket"
        title="The bracket is drawn at the start"
        description={`Seeds are set once check-in closes. ${tournament.entrantCount} ${tournament.entrantType === "team" ? "teams" : "players"} are in so far.`}
      />
    );
  }
  if (query.isLoading) return <Skeleton className="h-112 rounded-card" />;
  if (query.isError || !bracket) {
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="The bracket didn't load"
        description={getApiErrorMessage(query.error, "Try again in a moment.")}
        action={
          <Button tone="outline" size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const render = (match: BracketMatch) => {
    const mine = match.sideA.entrantId === myEntrantId || match.sideB.entrantId === myEntrantId;
    return (
      <MatchCard
        key={match.id}
        match={match}
        entrants={entrants}
        mine={Boolean(myEntrantId) && mine}
        highlighted={Boolean(hovered) && path.has(match.id)}
        dimmed={Boolean(hovered) && !path.has(match.id)}
        onHover={setHovered}
        onOpen={() => onOpenMatch(match.id)}
      />
    );
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      {tournament.phase === "completed" && <Podium bracket={bracket} />}
      {bracket.stage?.type === "round_robin" ? (
        <RoundRobin bracket={bracket} myEntrantId={myEntrantId} />
      ) : (
        <>
          <p className="text-sm text-mist-500">Point at a name to trace their path. Select a match to see its details.</p>
          {eliminationLanes(bracket.matches).map((lane) => (
            <Lane key={lane.lane} title={lane.title} columns={lane.columns} render={render} />
          ))}
        </>
      )}
    </div>
  );
}
