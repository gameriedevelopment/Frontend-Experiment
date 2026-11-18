import { Button } from "@/components/ui/Button";
import { StatePanel } from "@/components/ui/StatePanel";
import { PhaseBadge } from "@/features/tournaments/components/PhaseBadge";
import { getApiErrorMessage } from "@/lib/errors";
import type { LeagueSeasonStatus } from "../types";
import { LEAGUE_SEASON_LABELS } from "../utils";

const tones: Record<LeagueSeasonStatus, "live" | "open" | "neutral" | "muted" | "danger"> = {
  draft: "muted",
  registration: "open",
  in_progress: "live",
  playoffs: "live",
  completed: "muted",
  cancelled: "danger",
};

export function LeagueStatusBadge({ status, paused, className }: { status: LeagueSeasonStatus | null; paused?: boolean; className?: string }) {
  if (paused) return <PhaseBadge label="Paused" tone="neutral" className={className} />;
  if (!status) return <PhaseBadge label="Off season" tone="muted" className={className} />;
  return <PhaseBadge label={LEAGUE_SEASON_LABELS[status]} tone={tones[status]} className={className} />;
}

/** A section whose request failed, so a failure never reads as "nothing here yet". */
export function LeagueLoadError({ what, error, onRetry }: { what: string; error: unknown; onRetry: () => void }) {
  return (
    <StatePanel
      icon="warning"
      tone="danger"
      title={`The ${what} didn't load`}
      description={getApiErrorMessage(error, "Gamerie couldn't reach this league just now.")}
      action={
        <Button tone="outline" size="sm" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}
