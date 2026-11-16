import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { TokenMark } from "@/components/ui/TokenMark";
import { cn } from "@/lib/cn";

const panel = {
  initial: { opacity: 0, y: 14, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(4px)" },
  transition: { duration: 0.8, ease: easeOutExpo },
};

export function ProofPips({ strength, className }: { strength: number; className?: string }) {
  return (
    <span aria-label={`Proof strength ${strength} of 3`} className={cn("flex items-end gap-1", className)}>
      {[0, 1, 2].map((pip) => (
        <span
          key={pip}
          className={cn(
            "w-1.5 rounded-full transition-colors duration-700",
            ["h-2", "h-3", "h-4"][pip],
            pip < strength ? "bg-current" : "bg-current/20",
          )}
        />
      ))}
    </span>
  );
}

function MatchCard({ step }: { step: number }) {
  const reported = step >= 1;
  return (
    <div className="rounded-2xl bg-[linear-gradient(140deg,var(--color-ink-700),var(--color-ink-900))] p-5 ring-1 ring-white/10 sm:p-7">
      <div className="flex items-center justify-between text-sm">
        <span className="text-mist-400">Lagos Cup · Semi-final</span>
        <span className="text-mist-500">Valorant</span>
      </div>
      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <TokenMark className="h-8 shrink-0 text-lavender-400" />
          <span className="truncate font-semibold">Lagos Lions</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={reported ? "score" : "vs"}
            className="type-display text-[clamp(1.6rem,3.6vw,2.2rem)] leading-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: easeOutExpo }}
          >
            {reported ? (
              <>
                13<span className="mx-1.5 text-mist-500">:</span>
                <span className="text-mist-500">9</span>
              </>
            ) : (
              <span className="text-mist-500">vs</span>
            )}
          </motion.p>
        </AnimatePresence>
        <div className="flex min-w-0 items-center justify-end gap-3">
          <span className="truncate font-semibold text-mist-300">Northside</span>
          <TokenMark className="h-8 shrink-0 text-white/25" />
        </div>
      </div>
    </div>
  );
}

function ReadyPanel() {
  return (
    <motion.div key="ready" {...panel} className="flex items-center gap-4 rounded-2xl bg-white/4 p-4 ring-1 ring-inset ring-white/8">
      <span className="relative grid size-2.5 place-items-center">
        <span className="absolute size-2.5 animate-ping rounded-full bg-lavender-400/60 motion-reduce:animate-none" />
        <span className="size-2 rounded-full bg-lavender-400" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-mist-50">Match ready</p>
        <p className="mt-0.5 text-mist-400">Both teams checked in · Today, 20:00</p>
      </div>
    </motion.div>
  );
}

function ReportPanel() {
  const rows = [
    { label: "Score declared by Lagos Lions", delay: 0.2 },
    { label: "Accepted by Northside", delay: 1.1 },
  ];
  return (
    <motion.div key="report" {...panel} className="rounded-2xl bg-white/4 p-2 ring-1 ring-inset ring-white/8">
      <ul className="divide-y divide-white/6">
        {rows.map((row) => (
          <motion.li
            key={row.label}
            className="flex items-center justify-between px-3 py-3 text-sm"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: row.delay, ease: easeOutExpo }}
          >
            <span className="text-mist-200">{row.label}</span>
            <Icon name="check" className="size-4 text-lavender-300" weight="bold" />
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

function RecordPanel() {
  return (
    <motion.div key="record" {...panel} className="rounded-2xl bg-white/4 p-5 ring-1 ring-inset ring-white/8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-mist-400">Valorant · Tournament</p>
          <p className="mt-1 text-lg font-semibold">
            Victory 13–9 <span className="font-normal text-mist-400">vs Northside</span>
          </p>
        </div>
        <span className="flex items-center gap-2 text-sm text-signal">
          <ProofPips strength={3} />
          Recorded
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/8 pt-4 text-sm">
        <div>
          <p className="text-mist-400">GP</p>
          <p className="mt-1 font-medium text-mist-50">Earned</p>
        </div>
        <div>
          <p className="text-mist-400">Level</p>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full bg-lavender-400"
              initial={{ width: "54%" }}
              animate={{ width: "72%" }}
              transition={{ duration: 1.6, delay: 0.5, ease: easeOutExpo }}
            />
          </div>
        </div>
        <div>
          <p className="text-mist-400">Leaderboard</p>
          <p className="mt-1 font-medium text-mist-50">Updated</p>
        </div>
      </div>
    </motion.div>
  );
}

export function ProofVisual({ step }: { step: number }) {
  return (
    <div className="relative isolate overflow-hidden rounded-panel bg-ink-950 px-6 py-10 text-mist-50 sm:px-12 sm:py-14">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_30%,rgb(198_163_255/0.12),transparent)]"
      />
      <div aria-hidden="true" className="mx-auto grid max-w-md gap-4">
        <MatchCard step={step} />
        <div className="h-42">
          <AnimatePresence mode="wait">
            {step === 0 && <ReadyPanel />}
            {step === 1 && <ReportPanel />}
            {step === 2 && <RecordPanel />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
