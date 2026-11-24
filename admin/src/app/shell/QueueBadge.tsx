import { cn } from "@/lib/cn";

export function QueueBadge({ count, overdue, className }: { count: number; overdue?: boolean; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "grid h-5 min-w-5 place-items-center rounded-full px-1.5 font-mono text-[0.65rem] font-semibold tabular-nums",
        overdue ? "bg-danger text-ink-950" : "bg-lavender-400 text-ink-950",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
