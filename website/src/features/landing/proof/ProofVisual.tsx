import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

const panel = {
  initial: { opacity: 0, y: 14, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -10, filter: "blur(4px)" },
  transition: { duration: 0.8, ease: easeOutExpo },
};

const readFields = [
  { label: "Result", value: "Victory" },
  { label: "Score", value: "3 – 1" },
  { label: "Player", value: "@nova" },
];

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

function ResultScreen({ step }: { step: number }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-[linear-gradient(140deg,var(--color-ink-700),var(--color-ink-900))] ring-1 ring-white/10">
      <div className="halftone absolute inset-0 text-white/[0.05]" />
      <motion.div
        className="relative flex h-full flex-col justify-between p-5 sm:p-7"
        animate={{ filter: step === 2 ? "blur(6px)" : "blur(0px)", opacity: step === 2 ? 0.45 : 1 }}
        transition={{ duration: 0.8, ease: easeOutExpo }}
      >
        <p className="type-label text-mist-400">Full time</p>
        <div>
          <p className="type-display text-[clamp(1.8rem,4vw,2.6rem)] leading-none text-lavender-300">Victory</p>
          <div className="mt-4 flex items-end justify-between gap-4 text-sm font-medium text-mist-300">
            <span>@nova</span>
            <span className="type-display text-[clamp(1.4rem,3vw,2rem)] leading-none text-mist-50">3 – 1</span>
            <span>@kemi.gg</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {step === 1 && (
          <motion.span
            key="scan"
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-lavender-400/25 to-transparent"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: ["-100%", "300%"], opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          />
        )}
        {step === 2 && (
          <motion.span
            key="private"
            className="absolute inset-0 grid place-items-center"
            {...panel}
          >
            <span className="flex items-center gap-2 rounded-full bg-ink-950/80 px-4 py-2 text-sm text-mist-200 ring-1 ring-white/10 backdrop-blur">
              <Icon name="lock" className="size-4" weight="duotone" />
              Screenshot kept private
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadPanel() {
  return (
    <motion.div key="upload" {...panel} className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/8">
      <Icon name="image" className="size-6 text-lavender-300" weight="duotone" />
      <div className="min-w-0 flex-1">
        <div className="flex justify-between text-sm">
          <span className="truncate text-mist-200">result-screen.jpg</span>
          <span className="text-mist-500">Uploading</span>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full bg-lavender-400"
            initial={{ width: "8%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.6, ease: easeOutExpo }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ReadPanel() {
  return (
    <motion.div key="read" {...panel} className="rounded-2xl bg-white/[0.04] p-2 ring-1 ring-inset ring-white/8">
      <dl className="divide-y divide-white/6">
        {readFields.map((field, index) => (
          <motion.div
            key={field.label}
            className="flex items-center justify-between px-3 py-2.5 text-sm"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.9 + index * 0.25, ease: easeOutExpo }}
          >
            <dt className="text-mist-400">{field.label}</dt>
            <dd className="flex items-center gap-2 font-medium text-mist-50">
              {field.value}
              <Icon name="check" className="size-4 text-lavender-300" weight="bold" />
            </dd>
          </motion.div>
        ))}
      </dl>
    </motion.div>
  );
}

function RecordPanel() {
  return (
    <motion.div key="record" {...panel} className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-inset ring-white/8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-mist-400">EA FC · Just now</p>
          <p className="mt-1 text-lg font-semibold">
            Victory 3–1 <span className="font-normal text-mist-400">vs @kemi.gg</span>
          </p>
        </div>
        <span className="flex items-center gap-2 text-sm text-signal">
          <ProofPips strength={2} />
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
          <p className="text-mist-400">Streak</p>
          <p className="mt-1 font-medium text-mist-50">4 wins</p>
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
        <ResultScreen step={step} />
        <div className="h-[10.5rem]">
          <AnimatePresence mode="wait">
            {step === 0 && <UploadPanel />}
            {step === 1 && <ReadPanel />}
            {step === 2 && <RecordPanel />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
