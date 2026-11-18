import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { TokenMark } from "@/components/ui/TokenMark";
import { TournamentArt } from "@/features/tournaments/components/TournamentArt";
import { cn } from "@/lib/cn";
import type { LeagueSummary } from "../types";
import { LEAGUE_JOIN_LABELS, formatLeagueDateRange, formatLeagueMoney, leagueCardAction } from "../utils";
import { LeagueStatusBadge } from "./LeagueBits";

export function LeagueCard({ league }: { league: LeagueSummary }) {
  const season = league.season;
  const capacity = season?.maxParticipants ?? 0;
  const count = season?.participantCount ?? 0;
  const fill = capacity ? Math.min(100, Math.round((count / capacity) * 100)) : 0;
  const action = leagueCardAction(league);
  return (
    <Link
      to={action.href}
      aria-label={`${action.label}: ${league.name}`}
      className="group flex h-full flex-col overflow-hidden rounded-card bg-ink-900 ring-1 ring-inset ring-white/6 transition-[box-shadow,transform] duration-500 ease-out-expo hover:-translate-y-0.5 hover:ring-lavender-400/30"
    >
      <div className="relative">
        <TournamentArt src={league.banner} game={league.game.name} className="aspect-16/7" />
        <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/10 to-transparent" />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
          <LeagueStatusBadge status={league.status === "draft" ? "draft" : (season?.status ?? null)} />
          {league.removed ? (
            <span
              title={league.removed.reason ?? undefined}
              className="type-label flex items-center gap-1.5 rounded-full bg-ink-950/80 px-2.5 py-1 text-danger ring-1 ring-inset ring-danger/40 backdrop-blur"
            >
              <Icon name="prohibit" className="size-3" />
              Removed by Gamerie
            </span>
          ) : (
            league.official && (
              <span className="type-label flex items-center gap-1.5 rounded-full bg-ink-950/70 px-2.5 py-1 text-mist-200 ring-1 ring-inset ring-white/10 backdrop-blur">
                <TokenMark className="h-3 text-lavender-300" />
                Official
              </span>
            )
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 pb-5">
        <div className="flex min-w-0 gap-3">
          {league.logo && <img src={league.logo} alt="" className="size-11 shrink-0 rounded-xl object-cover ring-1 ring-white/10" />}
          <div className="min-w-0">
            <p className="type-label text-lavender-300">{league.game.name}</p>
            <h3 className="mt-2 line-clamp-2 text-[1.05rem] font-semibold leading-snug group-hover:text-lavender-100">{league.name}</h3>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-mist-400">
              {season && <span>Season {season.number}</span>}
              <span>{season ? formatLeagueDateRange(season.startsAt, season.endsAt) : "Between seasons"}</span>
              <span>{league.entrantType === "team" ? "Teams" : "Solo"}</span>
              <span>by {league.host.name}</span>
            </p>
          </div>
        </div>
        <div className="mt-auto grid gap-3 border-t border-white/6 pt-4">
          <div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-mist-500">{LEAGUE_JOIN_LABELS[league.joinMode]}</span>
              <span className="tabular-nums text-mist-300">
                {count}
                {capacity ? ` / ${capacity}` : " entered"}
              </span>
            </div>
            {capacity > 0 && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-lavender-400" style={{ width: `${fill}%` }} />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className={cn("flex items-center gap-1.5 text-sm", season?.prize?.total ? "font-semibold" : "text-mist-500")}>
              <Icon name="coins" weight={season?.prize?.total ? "duotone" : "regular"} className={cn("size-4", season?.prize?.total && "text-lavender-300")} />
              {season?.prize?.total ? formatLeagueMoney(season.prize.total, season.prize.currency) : "No prize"}
            </span>
            {action.state === "register" || action.state === "manage" ? (
              <span className="flex items-center gap-1.5 rounded-full bg-lavender-400 px-3.5 py-1.5 text-sm font-semibold text-ink-950 transition-colors group-hover:bg-lavender-300">
                {action.label}
                <Icon name="arrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            ) : action.state === "registered" ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-signal">
                <Icon name="check" weight="bold" className="size-3.5" />
                {action.label}
              </span>
            ) : (
              <span className={cn("flex items-center gap-1 text-sm font-medium", action.state === "view" || action.state === "setup" ? "text-lavender-300" : "text-mist-100")}>
                {action.label}
                <Icon name="arrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
