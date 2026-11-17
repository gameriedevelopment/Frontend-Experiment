import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { TimelineStep } from "../lifecycle";

export function ChallengeTimeline({ steps }: { steps: TimelineStep[] }) {
  const finished = steps.every((step) => step.state === "done");
  return (
    <ol aria-label="Challenge progress" className="grid grid-cols-4 gap-2">
      {steps.map((step, index) => (
        <li key={step.label} className="grid gap-2.5">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full ring-1 ring-inset",
                step.state === "done" &&
                  (finished && index === steps.length - 1
                    ? "bg-signal text-ink-950 ring-signal"
                    : "bg-lavender-400 text-ink-950 ring-lavender-400"),
                step.state === "current" && "bg-lavender-400/14 text-lavender-300 ring-lavender-400/60",
                step.state === "upcoming" && "text-mist-500 ring-white/12",
                step.state === "stopped" && "bg-white/5 text-mist-400 ring-white/15",
              )}
            >
              {step.state === "done" ? (
                <Icon name="check" weight="bold" className="size-3" />
              ) : step.state === "stopped" ? (
                <Icon name="close" weight="bold" className="size-3" />
              ) : (
                <span className={cn("size-1.5 rounded-full", step.state === "current" ? "bg-lavender-300" : "bg-white/20")} />
              )}
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn("h-px flex-1", step.state === "done" ? "bg-lavender-400/50" : "bg-white/10")}
              />
            )}
          </div>
          <span
            className={cn(
              "text-xs font-medium sm:text-sm",
              step.state === "current" ? "text-mist-50" : step.state === "done" ? "text-mist-300" : "text-mist-500",
            )}
          >
            {step.label}
            <span className="sr-only">
              {step.state === "done" ? ", done" : step.state === "current" ? ", current step" : step.state === "stopped" ? ", stopped here" : ""}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
