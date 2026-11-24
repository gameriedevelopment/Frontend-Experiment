import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const tones = {
  danger: "bg-danger/8 text-danger ring-danger/40",
  signal: "bg-signal/8 text-signal ring-signal/35",
  lavender: "bg-lavender-400/8 text-lavender-200 ring-lavender-400/35",
  mist: "bg-white/4 text-mist-300 ring-white/15",
} as const;

/** A case-file status mark: Banned, Verified, Admin, Reported. */
export function Stamp({ tone = "mist", icon, children, className }: { tone?: keyof typeof tones; icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <span className={cn("type-label inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[0.6rem] ring-1 ring-inset", tones[tone], className)}>
      {icon && <Icon name={icon} weight="bold" className="size-3" />}
      {children}
    </span>
  );
}
