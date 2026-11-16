import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

export function StatePanel({
  icon,
  tone = "neutral",
  title,
  description,
  action,
  className,
}: {
  icon: IconName;
  tone?: "neutral" | "danger";
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "grid justify-items-center gap-4 rounded-card bg-ink-900/60 px-6 py-14 text-center ring-1 ring-inset ring-white/6",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-12 place-items-center rounded-2xl ring-1 ring-inset",
          tone === "danger" ? "bg-danger/10 text-danger ring-danger/25" : "bg-white/5 text-lavender-300 ring-white/8",
        )}
      >
        <Icon name={icon} className="size-6" weight="duotone" />
      </span>
      <div className="max-w-sm">
        <p className="text-base font-semibold">{title}</p>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-mist-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
