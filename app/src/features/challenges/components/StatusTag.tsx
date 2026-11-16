import { cn } from "@/lib/cn";
import type { ChallengeTone } from "../lifecycle";

const toneClasses: Record<ChallengeTone, string> = {
  action: "bg-lavender-400/14 text-lavender-300",
  upcoming: "bg-white/7 text-mist-200",
  waiting: "bg-white/5 text-mist-400",
  done: "bg-white/5 text-mist-300",
  closed: "text-mist-500 ring-1 ring-inset ring-white/8",
  alert: "bg-danger/12 text-danger",
};

const dotClasses: Partial<Record<ChallengeTone, string>> = {
  action: "bg-lavender-300",
  upcoming: "bg-mist-200",
  alert: "bg-danger",
};

export function StatusTag({ tone, children, className }: { tone: ChallengeTone; children: string; className?: string }) {
  return (
    <span
      className={cn(
        "type-label inline-flex h-6 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-2.5",
        toneClasses[tone],
        className,
      )}
    >
      {dotClasses[tone] && <span aria-hidden="true" className={cn("size-1.5 rounded-full", dotClasses[tone])} />}
      {children}
    </span>
  );
}
