import { Panel } from "@/components/layout/Panel";
import { describeAction, formatDateTime } from "@/lib/format";

export interface ActivityEntry {
  id: string;
  action: string;
  actor?: string | null;
  actorRole?: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

const detailLine = (details: ActivityEntry["details"]) => {
  if (!details) return null;
  const text = details.reason ?? details.notes ?? details.message ?? details.title;
  return typeof text === "string" && text.trim() ? text : null;
};

/** What happened to a competition, newest first: organizer, player and admin actions alike. */
export function ActivityFeed({ entries, title = "Activity" }: { entries: ActivityEntry[]; title?: string }) {
  return (
    <Panel title={title}>
      {entries.length === 0 ? (
        <p className="text-sm text-mist-400">Nothing has happened yet.</p>
      ) : (
        <ol className="relative grid gap-4 before:absolute before:inset-y-1 before:left-[0.3rem] before:w-px before:bg-white/8">
          {entries.map((entry) => {
            const line = detailLine(entry.details);
            const admin = entry.actorRole === "admin";
            return (
              <li key={entry.id} className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-4">
                <span className={admin ? "relative top-1.5 size-[0.65rem] rounded-full bg-ink-900 ring-2 ring-danger/70" : "relative top-1.5 size-[0.65rem] rounded-full bg-ink-900 ring-2 ring-lavender-400/60"} />
                <span className="min-w-0">
                  <span className="block text-sm">
                    <span className="font-semibold">{entry.actor ?? (entry.actorRole ? describeAction(entry.actorRole) : "System")}</span>{" "}
                    <span className="text-mist-300">{describeAction(entry.action).toLowerCase()}</span>
                  </span>
                  {line && <span className="mt-0.5 block text-xs text-mist-400">“{line}”</span>}
                  <time dateTime={entry.createdAt} className="mt-1 block font-mono text-[0.68rem] text-mist-500">
                    {formatDateTime(entry.createdAt)}
                  </time>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
