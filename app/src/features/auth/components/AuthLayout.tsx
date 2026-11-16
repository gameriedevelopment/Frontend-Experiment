import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { TokenMark } from "@/components/ui/TokenMark";
import { publicLinks } from "@/config/links";
import { cn } from "@/lib/cn";

const floatingChips = [
  { label: "Result verified · 13–9", tone: "signal", icon: "verified", position: "left-[8%] top-[24%]", delay: 0 },
  { label: "Level 13", tone: "lavender", icon: "bolt", position: "right-[9%] top-[38%]", delay: 1.2 },
  { label: "Squad fit 94%", tone: "muted", icon: "community", position: "left-[14%] top-[56%]", delay: 2.1 },
] as const;

function Brand({ className }: { className?: string }) {
  return (
    <a href={publicLinks.website} aria-label="Gamerie website" className={cn("flex items-center gap-2.5", className)}>
      <TokenMark className="h-6 text-lavender-400" />
      <span className="type-display text-[1.05rem] tracking-[0.04em]">Gamerie</span>
    </a>
  );
}

function AuthStage({ title }: { title: readonly [string, string] }) {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden overflow-hidden rounded-panel bg-ink-900 ring-1 ring-inset ring-white/6 lg:flex lg:flex-col lg:justify-between lg:p-12"
    >
      <div className="halftone absolute inset-0 text-lavender-400/[0.07] [mask-image:radial-gradient(70%_60%_at_60%_40%,black,transparent)]" />
      <div className="absolute inset-x-0 top-[12%] mx-auto h-[56%] w-[18%] min-w-28 bg-lavender-400/10 blur-3xl" />
      <div className="halftone-coarse absolute inset-x-0 top-[12%] mx-auto h-[56%] w-[18%] min-w-28 text-lavender-300 [mask-composite:intersect] [mask-image:url(/token-mask.svg),linear-gradient(150deg,black_25%,transparent_92%)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain,100%_100%]" />

      {floatingChips.map((chip) => (
        <motion.div
          key={chip.label}
          className={cn("absolute", chip.position)}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, delay: chip.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Tag tone={chip.tone} size="md" className="bg-ink-900/80 ring-1 ring-white/10 backdrop-blur">
            <Icon name={chip.icon} className="size-3.5" weight="bold" />
            {chip.label}
          </Tag>
        </motion.div>
      ))}

      <Brand className="relative" />

      <div className="relative">
        <p className="type-display text-display-md">
          <span className="block">{title[0]}</span>
          <span className="block text-lavender-400">{title[1]}</span>
        </p>
        <p className="mt-5 max-w-sm text-lead text-mist-300">
          Your record, your teams and your next match are waiting.
        </p>
      </div>
    </aside>
  );
}

export function AuthLayout({
  stageTitle,
  aside,
  children,
}: {
  stageTitle: readonly [string, string];
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-svh bg-ink-950 text-mist-50 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-3 lg:p-3">
      <AuthStage title={stageTitle} />
      <section className="flex min-h-svh flex-col px-gutter py-6 lg:min-h-0 lg:px-14 lg:py-9">
        <header className="flex items-center justify-between gap-4">
          <Brand className="lg:invisible" />
          {aside && <div className="text-sm text-mist-400">{aside}</div>}
        </header>
        <div className="mx-auto my-auto w-full max-w-[25rem] py-12">{children}</div>
        <footer className="text-center text-xs leading-relaxed text-mist-500">
          By continuing, you agree to Gamerie's{" "}
          <a className="text-mist-300 underline-offset-4 hover:underline" href={publicLinks.terms}>
            Terms
          </a>{" "}
          and{" "}
          <a className="text-mist-300 underline-offset-4 hover:underline" href={publicLinks.privacy}>
            Privacy Policy
          </a>
          .
        </footer>
      </section>
    </main>
  );
}
