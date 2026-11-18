import { Button } from "@/components/ui/Button";
import { StatePanel } from "@/components/ui/StatePanel";
import { PhaseBadge } from "@/features/tournaments/components/PhaseBadge";
import { getApiErrorMessage } from "@/lib/errors";
import type { LadderStatus } from "../types";
import { LADDER_STATUS_LABELS } from "../utils";

const tones: Record<LadderStatus, "live" | "open" | "neutral" | "muted" | "danger"> = {
  draft: "muted",
  upcoming: "open",
  in_progress: "live",
  completed: "muted",
  archived: "muted",
};

export function LadderStatusBadge({ status, className }: { status: LadderStatus; className?: string }) {
  return <PhaseBadge label={LADDER_STATUS_LABELS[status]} tone={tones[status]} className={className} />;
}

/** A section whose request failed, so a failure never reads as "nothing here yet". */
export function LadderLoadError({ what, error, onRetry }: { what: string; error: unknown; onRetry: () => void }) {
  return (
    <StatePanel
      icon="warning"
      tone="danger"
      title={`The ${what} didn't load`}
      description={getApiErrorMessage(error, "Gamerie couldn't reach this ladder just now.")}
      action={
        <Button tone="outline" size="sm" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}
