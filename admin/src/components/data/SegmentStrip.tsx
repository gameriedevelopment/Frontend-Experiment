import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

export interface Segment {
  key: string;
  label: string;
  value: number | undefined;
  /** The segment reads as a warning when it has any members. */
  tone?: "default" | "danger" | "signal";
  hint?: string;
}

const COLUMNS: Record<number, string> = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" };

/** Headline counts that double as quick filters: pick a segment to see just those rows. */
export function SegmentStrip({ segments, active, onPick, loading }: { segments: Segment[]; active: string | null; onPick: (key: string | null) => void; loading: boolean }) {
  return (
    <div
      role="group"
      aria-label="Segments"
      className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-card bg-white/6 ring-1 ring-inset ring-white/6 sm:grid-cols-3", COLUMNS[segments.length] ?? "lg:grid-cols-6")}
    >
      {segments.map((segment) => {
        const selected = active === segment.key;
        const hot = (segment.value ?? 0) > 0 && segment.tone && segment.tone !== "default";
        return (
          <button
            key={segment.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onPick(selected ? null : segment.key)}
            className={cn("group relative bg-ink-900 px-5 py-4 text-left transition-colors hover:bg-ink-850", selected && "bg-ink-850")}
          >
            {selected && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-lavender-400" />}
            <span className="type-label block text-[0.6rem] text-mist-500 group-hover:text-mist-300">{segment.label}</span>
            {loading ? (
              <Skeleton className="mt-3 h-6 w-16 rounded-md" />
            ) : (
              <span
                className={cn(
                  "mt-2.5 block text-[1.45rem] font-semibold leading-none tabular-nums",
                  hot && segment.tone === "danger" && "text-danger",
                  hot && segment.tone === "signal" && "text-signal",
                )}
              >
                {segment.value == null ? "—" : new Intl.NumberFormat("en").format(segment.value)}
              </span>
            )}
            {segment.hint && <span className="mt-1.5 block truncate text-xs text-mist-500">{segment.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
