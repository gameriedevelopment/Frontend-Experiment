import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { TokenMark } from "@/components/ui/TokenMark";
import { cn } from "@/lib/cn";
import type { Tournament } from "../types";
import { cardAction, formatLabel, formatMoney, formatPrize, isHosted, safeTournamentUrl } from "../utils";
import { PhaseBadge, phaseOf } from "./PhaseBadge";
import { TournamentArt } from "./TournamentArt";

function startLabel(value: string | null) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(value),
  );
}

export function TournamentCard({ tournament, preview = false }: { tournament: Tournament; preview?: boolean }) {
  const hosted = isHosted(tournament);
  const [phase, tone] = phaseOf(tournament);
  const capacity = tournament.bracketSize ?? tournament.maxTeams ?? 0;
  const entrants = tournament.entrantCount ?? tournament.currentTeams ?? 0;
  const fill = capacity ? Math.min(100, Math.round((entrants / capacity) * 100)) : 0;
  const prize = tournament.prize?.total
    ? formatMoney(tournament.prize.total, tournament.prize.currency)
    : tournament.prizePool
      ? formatPrize(tournament.prizePool)
      : null;
  const external = !hosted ? safeTournamentUrl(tournament.platformUrl) : undefined;
  const action = hosted ? cardAction(tournament) : null;
  const entry =
    tournament.entrantType === "team"
      ? `Teams${tournament.teamSize ? ` · ${tournament.teamSize}v${tournament.teamSize}` : ""}`
      : tournament.entrantType === "player"
        ? "Solo"
        : null;

  const body = (
    <>
      <div className="relative">
        <TournamentArt src={tournament.image} game={tournament.game} className="aspect-16/8" />
        <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/10 to-transparent" />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
          <PhaseBadge label={phase} tone={tone} />
          {hosted ? (
            <span className="type-label flex items-center gap-1.5 rounded-full bg-ink-950/70 px-2.5 py-1 text-mist-200 ring-1 ring-inset ring-white/10 backdrop-blur">
              <TokenMark className="h-3 text-lavender-300" />
              {tournament.source === "official" ? "Official" : "On Gamerie"}
            </span>
          ) : (
            <span className="type-label flex items-center gap-1.5 rounded-full bg-ink-950/70 px-2.5 py-1 text-mist-300 ring-1 ring-inset ring-white/10 backdrop-blur">
              {tournament.platform}
              <Icon name="external" className="size-3" />
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pb-5">
        <div className="min-w-0">
          <p className="type-label text-lavender-300">{tournament.game}</p>
          <h3 className="mt-2 line-clamp-2 text-[1.05rem] font-semibold leading-snug transition-colors group-hover:text-lavender-100">
            {tournament.name}
          </h3>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-mist-400">
            <span>{startLabel(tournament.startDate)}</span>
            {hosted && <span>{formatLabel(tournament.format)}</span>}
            {entry && <span>{entry}</span>}
          </p>
        </div>

        <div className="mt-auto grid gap-3 border-t border-white/6 pt-4">
          {capacity > 0 && (
            <div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-mist-500">
                  {tournament.entrantType === "team" || (tournament.teamSize ?? 1) > 1 ? "Teams" : "Players"}
                </span>
                <span className="tabular-nums text-mist-300">
                  {entrants} / {capacity}
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className={cn("h-full rounded-full", fill >= 100 ? "bg-mist-400" : "bg-lavender-400")}
                  style={{ width: `${fill}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className={cn("flex items-center gap-1.5 text-sm", prize ? "font-semibold text-mist-50" : "text-mist-500")}>
              <Icon name="coins" weight={prize ? "duotone" : "regular"} className={cn("size-4", prize && "text-lavender-300")} />
              {prize ?? "No prize"}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                action?.primary ? "text-lavender-300" : "text-mist-400",
              )}
            >
              {action?.label ?? (external ? `Open on ${tournament.platform}` : "Details")}
              <Icon
                name={external ? "arrowUpRight" : "arrowRight"}
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </div>
      </div>
    </>
  );

  const classes =
    "group flex h-full flex-col overflow-hidden rounded-card bg-ink-900 ring-1 ring-inset ring-white/6 transition-[box-shadow,transform] duration-500 ease-out-expo hover:-translate-y-0.5 hover:ring-lavender-400/30";

  if (preview) {
    return (
      <div aria-hidden="true" className={classes}>
        {body}
      </div>
    );
  }
  if (external) {
    return (
      <a href={external} target="_blank" rel="noreferrer" className={classes}>
        {body}
      </a>
    );
  }
  return (
    <Link to={action?.to ?? `/tournaments/${tournament.id}`} className={classes}>
      {body}
    </Link>
  );
}
