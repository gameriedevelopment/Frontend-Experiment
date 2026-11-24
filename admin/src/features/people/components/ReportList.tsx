import { Panel } from "@/components/layout/Panel";
import { formatDate, statusLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ReportSummary } from "../types";

/** Reports filed about this record, newest first. */
export function ReportList({ against, open, filed, latest }: { against: number; open: number; filed?: number; latest: ReportSummary[] }) {
  return (
    <Panel
      title="Reports"
      description={`${against} about them${filed !== undefined ? ` · ${filed} filed by them` : ""}${open ? ` · ${open} waiting` : ""}`}
    >
      {latest.length === 0 ? (
        <p className="text-sm text-mist-400">Nobody has reported this.</p>
      ) : (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
          {latest.map((report) => (
            <li key={report.id} className="grid gap-1 rounded-xl bg-white/3 px-4 py-3 ring-1 ring-inset ring-white/6">
              <span className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{statusLabel(report.type)}</span>
                <span className="font-mono text-xs text-mist-500">on a {report.contentType}</span>
                <span
                  className={cn(
                    "type-label ml-auto rounded-md px-1.5 py-1 text-[0.55rem] ring-1 ring-inset",
                    report.status === "pending" ? "bg-lavender-400/10 text-lavender-200 ring-lavender-400/30" : "text-mist-400 ring-white/12",
                  )}
                >
                  {statusLabel(report.status)}
                </span>
              </span>
              {report.reason && <span className="text-sm text-mist-300">{report.reason}</span>}
              <span className="font-mono text-[0.68rem] text-mist-500">{formatDate(report.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
