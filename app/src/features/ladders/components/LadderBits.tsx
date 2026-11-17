import { PhaseBadge } from "@/features/tournaments/components/PhaseBadge";
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
