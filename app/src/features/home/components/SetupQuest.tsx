import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { cn } from "@/lib/cn";
import type { SetupStep, SetupStepId } from "../setupSteps";

function StepMarker({ step, active }: { step: SetupStep; active: boolean }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full transition-colors duration-300",
        step.complete
          ? "bg-lavender-400/14 text-lavender-300"
          : active
            ? "bg-lavender-400 text-ink-950"
            : "text-mist-400 ring-1 ring-inset ring-white/12",
      )}
    >
      <Icon
        name={step.complete ? "check" : step.icon}
        weight={step.complete ? "bold" : active ? "fill" : "regular"}
        className="size-4"
      />
    </span>
  );
}

function StepReward({ step }: { step: SetupStep }) {
  if (step.progress && !step.complete) {
    return (
      <span className="type-label shrink-0 text-mist-400 tabular-nums">
        {step.progress.value} / {step.progress.target}
      </span>
    );
  }
  if (!step.gp) return null;
  return (
    <span className={cn("type-label shrink-0 tabular-nums", step.complete ? "text-mist-500" : "text-lavender-300")}>
      +{step.gp} GP
    </span>
  );
}

export function SetupQuest({
  steps,
  onHide,
  className,
}: {
  steps: SetupStep[];
  onHide: () => void;
  className?: string;
}) {
  const firstOpen = steps.find((step) => !step.complete)?.id ?? null;
  const [selected, setSelected] = useState<SetupStepId | null>(null);
  const activeId = selected && steps.some((step) => step.id === selected && !step.complete) ? selected : firstOpen;
  const [showDone, setShowDone] = useState(false);
  const done = steps.filter((step) => step.complete).length;
  const left = steps.length - done;
  const visible = showDone ? steps : steps.filter((step) => !step.complete);
  const totalGp = steps.reduce((sum, step) => sum + (step.complete ? 0 : (step.gp ?? 0)), 0);

  return (
    <section
      aria-labelledby="setup-title"
      className={cn("rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6", className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 id="setup-title" className="text-base font-semibold">
            Set up your player ID
          </h2>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-mist-400">
            {done === 0
              ? "Six first moves that make Gamerie work for you."
              : `${left} ${left === 1 ? "move" : "moves"} left.`}
            {totalGp > 0 && ` ${totalGp} GP waiting.`}
          </p>
        </div>
        <div className="flex items-center gap-4 pt-1">
          <span className="type-label text-mist-400 tabular-nums">
            {done} of {steps.length}
          </span>
          <button
            type="button"
            onClick={onHide}
            className="text-sm font-medium text-mist-500 transition-colors hover:text-mist-200"
          >
            Hide
          </button>
        </div>
      </header>

      <div aria-hidden="true" className="mt-5 flex gap-1">
        {steps.map((step) => (
          <span
            key={step.id}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-500",
              step.complete ? "bg-lavender-400" : step.id === activeId ? "bg-lavender-400/35" : "bg-white/8",
            )}
          />
        ))}
      </div>

      <ol className="mt-5 flex flex-col gap-1">
        {visible.map((step) => {
          const active = step.id === activeId;
          return (
            <li
              key={step.id}
              className={cn(
                "rounded-2xl transition-colors duration-300",
                active && "bg-white/3 ring-1 ring-inset ring-lavender-400/20",
              )}
            >
              <button
                type="button"
                disabled={step.complete}
                aria-expanded={step.complete ? undefined : active}
                aria-controls={`setup-step-${step.id}`}
                onClick={() => setSelected(step.id)}
                className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left disabled:cursor-default"
              >
                <StepMarker step={step} active={active} />
                <span
                  className={cn(
                    "min-w-0 flex-1 text-[0.95rem] font-semibold",
                    step.complete && "font-medium text-mist-400",
                  )}
                >
                  {step.title}
                  {step.complete && <span className="sr-only"> (done)</span>}
                </span>
                <StepReward step={step} />
              </button>
              <AnimatePresence initial={false}>
                {active && (
                  <motion.div
                    id={`setup-step-${step.id}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease: easeOutExpo }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-4 pb-4 pl-16 pr-4">
                      <p className="max-w-md text-sm leading-relaxed text-mist-300">{step.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <LinkButton to={step.action.href} size="sm" icon="arrowRight">
                          {step.action.label}
                        </LinkButton>
                        {step.secondaryAction && (
                          <LinkButton to={step.secondaryAction.href} size="sm" tone="outline">
                            {step.secondaryAction.label}
                          </LinkButton>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
      {done > 0 && (
        <button
          type="button"
          onClick={() => setShowDone((value) => !value)}
          aria-expanded={showDone}
          className="mt-3 flex items-center gap-1.5 px-3 text-sm font-medium text-mist-500 transition-colors hover:text-mist-200"
        >
          {showDone ? "Hide completed" : `Show ${done} completed`}
          <Icon name="chevronDown" className={cn("size-3.5 transition-transform", showDone && "rotate-180")} />
        </button>
      )}
    </section>
  );
}
