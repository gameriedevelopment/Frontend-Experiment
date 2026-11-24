import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Label and value pairs in a tight grid, for the side of a dossier. */
export function Facts({ items, className }: { items: Array<[label: string, value: ReactNode]>; className?: string }) {
  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-2xl bg-white/6 ring-1 ring-inset ring-white/6", className)}>
      {items.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 bg-ink-900 px-4 py-3">
          <dt className="type-label shrink-0 text-[0.6rem] text-mist-500">{label}</dt>
          <dd className="min-w-0 truncate text-right text-sm text-mist-100">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Big numbers in a row for the top of a dossier section. */
export function Figures({ items }: { items: Array<{ label: string; value: ReactNode; hint?: ReactNode }> }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/6 ring-1 ring-inset ring-white/6 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-ink-900 px-4 py-4">
          <p className="type-label text-[0.6rem] text-mist-500">{item.label}</p>
          <p className="mt-2.5 text-xl font-semibold leading-none tabular-nums">{item.value}</p>
          {item.hint && <p className="mt-1.5 text-xs text-mist-500">{item.hint}</p>}
        </div>
      ))}
    </div>
  );
}
