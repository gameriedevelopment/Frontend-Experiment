import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { figure } from "@/lib/format";
import type { DashboardMetrics } from "../types";

const CELLS: Array<{ key: keyof DashboardMetrics; label: string; to: string }> = [
  { key: "users", label: "Players", to: "/users" },
  { key: "teams", label: "Teams", to: "/teams" },
  { key: "tournaments", label: "Tournaments", to: "/tournaments" },
  { key: "ladders", label: "Ladders", to: "/ladders" },
  { key: "leagues", label: "Leagues", to: "/leagues" },
  { key: "games", label: "Games", to: "/games" },
];

export function KpiBand({ metrics, loading }: { metrics?: DashboardMetrics; loading: boolean }) {
  return (
    <section aria-label="Platform figures" className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-white/6 ring-1 ring-inset ring-white/6 sm:grid-cols-3 xl:grid-cols-6">
      {CELLS.map((cell) => {
        const metric = metrics?.[cell.key];
        return (
          <Link key={cell.key} to={cell.to} className="group bg-ink-900 p-5 transition-colors hover:bg-ink-850 sm:p-6">
            <p className="type-label text-mist-500 transition-colors group-hover:text-mist-300">{cell.label}</p>
            {loading ? (
              <Skeleton className="mt-4 h-8 w-24 rounded-lg" />
            ) : (
              <p className="mt-4 text-[1.9rem] font-semibold leading-none tracking-tight tabular-nums">{metric ? figure(metric.total) : "—"}</p>
            )}
            <p className="mt-3 text-xs text-mist-400">
              {metric ? (
                <>
                  <span className={cn("font-mono tabular-nums", metric.thisMonth > 0 ? "text-lavender-200" : "text-mist-500")}>
                    {metric.thisMonth > 0 ? "+" : ""}
                    {figure(metric.thisMonth)}
                  </span>{" "}
                  this month
                </>
              ) : (
                <span className="invisible">—</span>
              )}
            </p>
          </Link>
        );
      })}
    </section>
  );
}
