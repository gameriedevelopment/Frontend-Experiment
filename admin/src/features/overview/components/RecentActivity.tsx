import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { Panel } from "@/components/layout/Panel";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/time";
import { describeAction } from "@/lib/format";
import { useRecentActivity } from "../hooks";

/** The latest admin actions, so the team can see what colleagues just did. */
export function RecentActivity() {
  const activity = useRecentActivity();
  const rows = activity.data?.data ?? [];
  return (
    <Panel
      title="Admin activity"
      actions={
        <Link to="/audit" className="type-label flex items-center gap-1.5 text-mist-400 transition-colors hover:text-mist-100">
          Audit log <Icon name="arrowRight" className="size-3.5" />
        </Link>
      }
    >
      {activity.isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-10 rounded-xl" />
          ))}
        </div>
      ) : activity.isError ? (
        <p className="text-sm text-mist-400">{getApiErrorMessage(activity.error, "Recent activity didn't load.")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-mist-400">No admin actions yet.</p>
      ) : (
        <ol className="relative grid gap-4 before:absolute before:inset-y-1 before:left-[0.3rem] before:w-px before:bg-white/8">
          {rows.map((row) => (
            <li key={row.id} className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-4 pl-0">
              <span className="relative top-0.5 size-[0.65rem] rounded-full bg-ink-900 ring-2 ring-lavender-400/60" />
              <span className="min-w-0">
                <span className="text-sm">
                  <span className="font-semibold">{row.actor || "An admin"}</span> <span className="text-mist-300">{describeAction(row.action).toLowerCase()}</span>{" "}
                  <span className="font-mono text-xs text-mist-500">{row.targetType}</span>
                </span>
                {row.reason && <span className="mt-0.5 block truncate text-xs text-mist-500">“{row.reason}”</span>}
              </span>
              <time dateTime={row.createdAt} className="font-mono text-xs tabular-nums text-mist-500">
                {timeAgo(row.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
