import { Panel } from "@/components/layout/Panel";
import { describeAction, formatDateTime } from "@/lib/format";
import type { AuditTrailEntry } from "../types";

/** Every admin action taken on this record. */
export function AuditTrail({ entries }: { entries: AuditTrailEntry[] }) {
  return (
    <Panel title="Admin history">
      {entries.length === 0 ? (
        <p className="text-sm text-mist-400">No admin has acted on this yet.</p>
      ) : (
        <ol className="relative grid gap-4 before:absolute before:inset-y-1 before:left-[0.3rem] before:w-px before:bg-white/8">
          {entries.map((entry) => (
            <li key={entry.id} className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-4">
              <span className="relative top-1.5 size-[0.65rem] rounded-full bg-ink-900 ring-2 ring-lavender-400/60" />
              <span className="min-w-0">
                <span className="block text-sm">
                  <span className="font-semibold">{entry.actor ?? "An admin"}</span> <span className="text-mist-300">{describeAction(entry.action).toLowerCase()}</span>
                </span>
                {entry.reason && <span className="mt-0.5 block text-xs text-mist-400">“{entry.reason}”</span>}
                <time dateTime={entry.createdAt} className="mt-1 block font-mono text-[0.68rem] text-mist-500">
                  {formatDateTime(entry.createdAt)}
                </time>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
