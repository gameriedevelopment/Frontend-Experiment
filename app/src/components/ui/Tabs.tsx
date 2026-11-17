import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/** Underlined section tabs. The caller keeps the value in the URL so tabs survive reloads and sharing. */
export function Tabs<T extends string>({
  label,
  items,
  value,
  onChange,
  indicatorId,
  className,
}: {
  label: string;
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Unique per page so the sliding underline doesn't animate between unrelated tab sets. */
  indicatorId: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("relative -mx-1 overflow-x-auto scrollbar-none", className)}>
      <ul className="flex min-w-max gap-1 border-b border-white/6 px-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={value === item.id ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={cn(
                "relative flex items-center gap-2 px-3.5 pb-3.5 pt-1 text-sm font-medium transition-colors",
                value === item.id ? "text-mist-50" : "text-mist-500 hover:text-mist-200",
              )}
            >
              {item.label}
              {item.count ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-lavender-400 px-1.5 text-[0.68rem] font-semibold tabular-nums text-ink-950">
                  {item.count}
                </span>
              ) : null}
              {value === item.id && (
                <motion.span
                  layoutId={indicatorId}
                  className="absolute inset-x-3.5 -bottom-px h-0.5 rounded-full bg-lavender-400"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
