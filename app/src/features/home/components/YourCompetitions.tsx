import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { PhaseBadge } from "@/features/tournaments/components/PhaseBadge";
import { useMyTournaments } from "@/features/tournaments/hooks";
import type { TournamentPhase } from "@/features/tournaments/types";
import { useLadders } from "@/features/ladders/hooks";
import type { LadderStatus } from "@/features/ladders/types";
import { useLeagues } from "@/features/leagues/hooks";
import type { LeagueSeasonStatus } from "@/features/leagues/types";
import { cn } from "@/lib/cn";
import { HomePanel } from "./HomePanel";

type Kind = "tournament" | "ladder" | "league";
type Tone = "live" | "open" | "neutral" | "muted" | "danger";

interface Row {
  kind: Kind;
  id: string;
  name: string;
  game: string;
  href: string;
  status: [string, Tone];
  role: string;
  when: string | null;
  /** Live first, then open for entries, then setting up. */
  rank: number;
}

const KINDS: Record<Kind, { label: string; plural: string; icon: IconName; href: string }> = {
  tournament: { label: "Tournament", plural: "Tournaments", icon: "trophy", href: "/tournaments?view=mine" },
  ladder: { label: "Ladder", plural: "Ladders", icon: "ladders", href: "/ladders?view=mine" },
  league: { label: "League", plural: "Leagues", icon: "leagues", href: "/leagues?view=mine" },
};

const TOURNAMENT: Partial<Record<TournamentPhase, [string, Tone, number]>> = {
  live: ["Live", "live", 0],
  paused: ["Paused", "neutral", 0],
  awaiting_start: ["Starting soon", "neutral", 1],
  check_in: ["Check-in open", "open", 1],
  registration: ["Entries open", "open", 2],
  draft: ["Draft", "muted", 3],
};
const LADDER: Partial<Record<LadderStatus, [string, Tone, number]>> = {
  in_progress: ["Live", "live", 0],
  upcoming: ["Upcoming", "open", 2],
  draft: ["Draft", "muted", 3],
};
const LEAGUE: Partial<Record<LeagueSeasonStatus, [string, Tone, number]>> = {
  in_progress: ["Live", "live", 0],
  playoffs: ["Playoffs", "live", 0],
  registration: ["Registration", "open", 2],
  draft: ["Draft", "muted", 3],
};

const entryRole = (organizer: boolean | undefined, entry: string | null | undefined) =>
  organizer ? "You run it" : entry === "pending_approval" ? "Awaiting approval" : entry === "invited" ? "Invited" : "Playing";

const shortDate = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(value)) : null;

/** Every tournament, ladder and league the player is in or runs, in one place. */
export function YourCompetitions({ className }: { className?: string }) {
  const tournaments = useMyTournaments("all");
  const ladders = useLadders({ view: "mine" });
  const leagues = useLeagues({ view: "mine" });
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [expanded, setExpanded] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const item of tournaments.data?.pages.flatMap((page) => page.data) ?? []) {
      const status = TOURNAMENT[item.phase];
      if (!status) continue;
      out.push({ kind: "tournament", id: item.id, name: item.name, game: item.game, href: `/tournaments/${item.id}`, status: [status[0], status[1]], role: item.isOrganizer ? "You run it" : "Playing", when: item.phase === "live" ? null : shortDate(item.startsAt), rank: status[2] });
    }
    for (const item of ladders.data?.pages.flatMap((page) => page.items) ?? []) {
      const status = LADDER[item.status];
      if (!status) continue;
      out.push({ kind: "ladder", id: item.id, name: item.name, game: item.game.name, href: `/ladders/${item.id}`, status: [status[0], status[1]], role: entryRole(item.viewer?.isOrganizer, item.viewer?.entryStatus), when: item.status === "in_progress" ? (item.endsAt ? `Ends ${shortDate(item.endsAt)}` : null) : shortDate(item.startsAt), rank: status[2] });
    }
    for (const item of leagues.data?.pages.flatMap((page) => page.items) ?? []) {
      const season = item.season;
      const status = item.status === "draft" ? LEAGUE.draft : season ? LEAGUE[season.status] : undefined;
      // Players never see a season the organizer is still setting up.
      if (!status || (status === LEAGUE.draft && !item.viewer?.isOrganizer)) continue;
      out.push({ kind: "league", id: item.id, name: item.name, game: item.game.name, href: `/leagues/${item.id}`, status: [status[0], status[1]], role: entryRole(item.viewer?.isOrganizer, item.viewer?.entryStatus), when: season ? (season.status === "registration" ? `Starts ${shortDate(season.startsAt)}` : `Season ${season.number}`) : null, rank: status[2] });
    }
    return out.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  }, [ladders.data, leagues.data, tournaments.data]);

  const loading = tournaments.isLoading || ladders.isLoading || leagues.isLoading;
  const counts = (Object.keys(KINDS) as Kind[]).map((kind) => ({ kind, total: rows.filter((row) => row.kind === kind).length, live: rows.filter((row) => row.kind === kind && row.rank === 0).length }));
  const shown = rows.filter((row) => filter === "all" || row.kind === filter);
  const visible = expanded ? shown : shown.slice(0, 5);

  if (!loading && !rows.length) return null;

  return (
    <HomePanel className={className} title="Your competitions" description="Everything you're playing in or running, live first.">
      {loading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
          <div role="group" aria-label="Filter competitions" className="grid grid-cols-3 gap-2">
            {counts.map(({ kind, total, live }) => (
              <button
                key={kind}
                type="button"
                aria-pressed={filter === kind}
                onClick={() => setFilter(filter === kind ? "all" : kind)}
                className={cn(
                  "min-w-0 rounded-2xl px-3 py-3 text-left ring-1 ring-inset transition-colors",
                  filter === kind ? "bg-lavender-400/10 ring-lavender-400/50" : "bg-white/3 ring-white/6 hover:bg-white/5",
                )}
              >
                <span className="flex items-center gap-1.5 text-xs text-mist-400">
                  <Icon name={KINDS[kind].icon} className="size-3.5 shrink-0" />
                  <span className="truncate">{KINDS[kind].plural}</span>
                </span>
                <span className="mt-1.5 flex items-baseline gap-2">
                  <span className="type-display text-2xl tabular-nums leading-none">{total}</span>
                  {live > 0 && <span className="text-xs font-semibold text-signal">{live} live</span>}
                </span>
              </button>
            ))}
          </div>
          {shown.length ? (
            <ul className="grid grid-cols-[minmax(0,1fr)]">
              {visible.map((row) => (
                <li key={`${row.kind}-${row.id}`} className="border-t border-white/6 first:border-t-0">
                  <Link to={row.href} className="group flex items-center gap-3 py-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/4 ring-1 ring-inset ring-white/8">
                      <Icon name={KINDS[row.kind].icon} className="size-4.5 text-lavender-300" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold group-hover:text-lavender-100">{row.name}</span>
                      <span className="block truncate text-xs text-mist-500">
                        {KINDS[row.kind].label} · {row.game} · {row.role}
                        {row.when ? ` · ${row.when}` : ""}
                      </span>
                    </span>
                    <PhaseBadge label={row.status[0]} tone={row.status[1]} className="hidden shrink-0 sm:inline-flex" />
                    <Icon name="arrowRight" className="size-3.5 shrink-0 text-mist-500 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mist-400">
              No {KINDS[filter as Kind].plural.toLowerCase()} right now.{" "}
              <Link to={KINDS[filter as Kind].href.split("?")[0]} className="font-medium text-lavender-300 hover:text-lavender-200">
                Find one
              </Link>
            </p>
          )}
          {shown.length > 5 && (
            <button type="button" onClick={() => setExpanded((value) => !value)} className="w-fit text-sm font-medium text-lavender-300 hover:text-lavender-200">
              {expanded ? "Show fewer" : `Show all ${shown.length}`}
            </button>
          )}
        </div>
      )}
    </HomePanel>
  );
}
