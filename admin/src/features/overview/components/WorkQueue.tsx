import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Panel } from "@/components/layout/Panel";
import { LANES, waited } from "@/features/queue/lanes";
import type { QueueSummary } from "@/features/queue/types";
import { cn } from "@/lib/cn";

/** Each lane of decisions waiting on an admin, with how long the oldest has sat there. */
export function WorkQueue({ queue, loading, retry, compact = false }: {
  queue?: QueueSummary;
  loading: boolean;
  retry: () => void;
  compact?: boolean;
}) {
  return (
    <Panel
      title="Needs a decision"
      actions={
        !compact && (
          <Link to="/queue" className="type-label flex items-center gap-1.5 text-mist-400 transition-colors hover:text-mist-100">
            Work queue <Icon name="arrowRight" className="size-3.5" />
          </Link>
        )
      }
    >
      {loading ? (
        <div className="grid gap-2">
          {LANES.map((lane) => (
            <Skeleton key={lane.key} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : !queue ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="Work queue didn't load"
          action={<Button tone="outline" size="sm" onClick={retry}>Try again</Button>}
        />
      ) : queue.total === 0 ? (
        <div className="flex items-center gap-4 rounded-2xl bg-signal/6 p-5 ring-1 ring-inset ring-signal/20">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-signal/14 text-signal">
            <Icon name="check" weight="bold" className="size-5" />
          </span>
          <p className="text-sm text-mist-200">Queue clear. New reports and disputes land here the moment they're filed.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
          {LANES.map((lane) => {
            const data = queue[lane.key];
            const count = data.count;
            const wait = waited(data.oldestAt, lane.dueHours);
            return (
              <li key={lane.key}>
                <Link
                  to={lane.to}
                  className={cn(
                    "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl px-4 py-3.5 ring-1 ring-inset transition-colors",
                    count ? "bg-white/3 ring-white/8 hover:bg-white/5" : "ring-transparent opacity-60 hover:opacity-100",
                  )}
                >
                  <span className={cn("grid size-10 place-items-center rounded-xl", count ? "bg-lavender-400/12 text-lavender-200" : "bg-white/4 text-mist-500")}>
                    <Icon name={lane.icon} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.93rem] font-semibold">{lane.label}</span>
                    <span className="block truncate text-xs text-mist-500">{lane.description}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    {wait && count > 0 && (
                      <span className={cn("hidden font-mono text-xs tabular-nums sm:inline", wait.overdue ? "text-danger" : "text-mist-400")}>
                        oldest {wait.label}
                      </span>
                    )}
                    <span className={cn("min-w-8 text-right text-xl font-semibold tabular-nums", count ? "text-mist-50" : "text-mist-500")}>{count}</span>
                    <Icon name="chevronRight" className="size-4 text-mist-500 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
