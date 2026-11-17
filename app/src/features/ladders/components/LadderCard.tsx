import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { TokenMark } from "@/components/ui/TokenMark";
import { TournamentArt } from "@/features/tournaments/components/TournamentArt";
import { cn } from "@/lib/cn";
import type { LadderSummary } from "../types";
import { LADDER_JOIN_LABELS, formatLadderDateRange, formatLadderMoney } from "../utils";
import { LadderStatusBadge } from "./LadderBits";

export function LadderCard({ ladder }: { ladder: LadderSummary }) {
  const capacity = ladder.maxParticipants ?? 0;
  const fill = capacity ? Math.min(100, Math.round((ladder.participantCount / capacity) * 100)) : 0;
  const to = ladder.status === "draft" ? `/ladders/${ladder.id}/edit` : `/ladders/${ladder.id}`;
  return (
    <Link
      to={to}
      className="group flex h-full flex-col overflow-hidden rounded-card bg-ink-900 ring-1 ring-inset ring-white/6 transition-[box-shadow,transform] duration-500 ease-out-expo hover:-translate-y-0.5 hover:ring-lavender-400/30"
    >
      <div className="relative">
        <TournamentArt src={ladder.banner} game={ladder.game.name} className="aspect-16/7" />
        <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/10 to-transparent" />
        <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
          <LadderStatusBadge status={ladder.status} />
          {ladder.official && (
            <span className="type-label flex items-center gap-1.5 rounded-full bg-ink-950/70 px-2.5 py-1 text-mist-200 ring-1 ring-inset ring-white/10 backdrop-blur">
              <TokenMark className="h-3 text-lavender-300" />
              Official
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 pb-5">
        <div className="min-w-0">
          <p className="type-label text-lavender-300">{ladder.game.name}</p>
          <h3 className="mt-2 line-clamp-2 text-[1.05rem] font-semibold leading-snug group-hover:text-lavender-100">{ladder.name}</h3>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-mist-400">
            <span>{formatLadderDateRange(ladder.startsAt, ladder.endsAt)}</span>
            <span>{ladder.entrantType === "team" ? "Teams" : "Solo"}</span>
            <span>by {ladder.host.name}</span>
          </p>
        </div>
        <div className="mt-auto grid gap-3 border-t border-white/6 pt-4">
          <div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-mist-500">{LADDER_JOIN_LABELS[ladder.joinMode]}</span>
              <span className="tabular-nums text-mist-300">
                {ladder.participantCount}
                {capacity ? ` / ${capacity}` : " joined"}
              </span>
            </div>
            {capacity > 0 && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-lavender-400" style={{ width: `${fill}%` }} />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className={cn("flex items-center gap-1.5 text-sm", ladder.prize?.total ? "font-semibold" : "text-mist-500")}>
              <Icon name="coins" weight={ladder.prize?.total ? "duotone" : "regular"} className={cn("size-4", ladder.prize?.total && "text-lavender-300")} />
              {ladder.prize?.total ? formatLadderMoney(ladder.prize.total, ladder.prize.currency) : "No prize"}
            </span>
            <span className="flex items-center gap-1 text-sm font-medium text-lavender-300">
              {ladder.status === "draft" ? "Continue setup" : ladder.status === "completed" ? "Final table" : "View ladder"}
              <Icon name="arrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
