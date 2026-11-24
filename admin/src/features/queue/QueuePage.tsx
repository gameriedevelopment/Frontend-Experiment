import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { WorkQueue } from "@/features/overview/components/WorkQueue";
import { timeAgo } from "@/lib/time";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueue } from "./hooks";
import { LANES } from "./lanes";

export function QueuePage() {
  useDocumentTitle("Work queue");
  const queue = useQueue();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        title="Work queue"
        refresh={[["admin", "queue"]]}
        description={
          <>
            Everything waiting on a decision, oldest first.
            {queue.data && <span className="ml-2 font-mono text-xs text-mist-500">Updated {timeAgo(queue.data.generatedAt)}</span>}
          </>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <WorkQueue queue={queue.data} loading={queue.isLoading} compact />
        <Panel title="Target times" description="How long an item can wait before it turns red.">
          <dl className="grid gap-3">
            {LANES.map((lane) => (
              <div key={lane.key} className="flex items-center justify-between gap-4 rounded-xl bg-white/3 px-4 py-3 ring-1 ring-inset ring-white/6">
                <dt className="text-sm text-mist-200">{lane.label}</dt>
                <dd className="font-mono text-sm tabular-nums text-mist-50">{lane.dueHours}h</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </div>
  );
}
