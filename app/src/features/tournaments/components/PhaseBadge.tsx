import { cn } from "@/lib/cn";
import type { Tournament, TournamentPhase } from "../types";

type Tone = "live" | "open" | "neutral" | "muted" | "danger";

const phaseCopy: Record<TournamentPhase, [string, Tone]> = {
  draft: ["Draft", "muted"],
  registration: ["Entries open", "open"],
  check_in: ["Check-in open", "open"],
  awaiting_start: ["Starting soon", "neutral"],
  live: ["Live", "live"],
  paused: ["Paused", "neutral"],
  completed: ["Completed", "muted"],
  cancelled: ["Cancelled", "danger"],
};

const toneClasses: Record<Tone, string> = {
  live: "bg-signal text-ink-950",
  open: "bg-lavender-400 text-ink-950",
  neutral: "bg-ink-950/70 text-mist-50 ring-1 ring-inset ring-white/15 backdrop-blur",
  muted: "bg-ink-950/70 text-mist-300 ring-1 ring-inset ring-white/10 backdrop-blur",
  danger: "bg-danger text-ink-950",
};

export function phaseOf(tournament: Pick<Tournament, "phase" | "status">): [string, Tone] {
  if (tournament.phase) return phaseCopy[tournament.phase];
  if (tournament.status === "ongoing") return ["Live", "live"];
  if (tournament.status === "completed") return ["Completed", "muted"];
  return ["Upcoming", "neutral"];
}

export function PhaseBadge({ label, tone, className }: { label: string; tone: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "type-label inline-flex h-6 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-2.5",
        toneClasses[tone],
        className,
      )}
    >
      {tone === "live" && (
        <span aria-hidden="true" className="relative flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-ink-950/60 motion-reduce:animate-none" />
          <span className="relative size-1.5 rounded-full bg-ink-950" />
        </span>
      )}
      {label}
    </span>
  );
}
