import { Button } from "@/components/ui/Button";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchField } from "@/components/data/SearchField";
import { PageHeader } from "@/components/layout/PageHeader";
import { waited } from "@/features/queue/lanes";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate, statusLabel } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { useReports } from "./hooks";
import { contentMeta, reportedSummary } from "./labels";
import { ReportCase } from "./ReportCase";
import type { ReportQuery, ReportStatus } from "./types";

const PER_PAGE = 30;

export function ReportsPage() {
  useDocumentTitle("Reports");
  const [state, set] = useQueryState({ status: "pending", content: "", type: "", search: "", page: "1", report: "" });
  const status = (["pending", "resolved", "dismissed"].includes(state.status) ? state.status : "pending") as ReportStatus;
  const query: ReportQuery = {
    page: Math.max(1, Number(state.page) || 1),
    perPage: PER_PAGE,
    status,
    contentType: state.content || undefined,
    type: state.type || undefined,
    search: state.search || undefined,
  };
  const reports = useReports(query);
  const rows = reports.data?.data ?? [];
  const selected = rows.find((report) => report.id === state.report) ?? rows[0] ?? null;
  const totalPages = reports.data?.totalPages ?? 1;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Reports" description="Posts, comments, players and teams the community has reported." refresh={[["admin", "reports"]]} />
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Status"
          value={status}
          onChange={(next) => set({ status: next, report: "" })}
          options={[
            { value: "pending", label: "Waiting" },
            { value: "resolved", label: "Resolved" },
            { value: "dismissed", label: "Dismissed" },
          ]}
        />
        <SearchField value={state.search} onChange={(search) => set({ search, report: "" })} placeholder="Search reasons" className="w-full sm:w-60" />
        <FilterMenu
          label="Content"
          value={state.content}
          onChange={(content) => set({ content, report: "" })}
          options={[
            { value: "post", label: "Posts" },
            { value: "comment", label: "Comments" },
            { value: "user", label: "Players" },
            { value: "team", label: "Teams" },
            { value: "hub", label: "Hubs" },
          ]}
        />
        <FilterMenu
          label="Reason"
          value={state.type}
          onChange={(type) => set({ type, report: "" })}
          options={[
            { value: "spam", label: "Spam" },
            { value: "harassment", label: "Harassment" },
            { value: "inappropriate", label: "Inappropriate" },
            { value: "other", label: "Other" },
          ]}
        />
      </div>

      {reports.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <Skeleton className="h-96 rounded-card" />
          <Skeleton className="h-96 rounded-card" />
        </div>
      ) : reports.isError ? (
        <p className="rounded-card bg-ink-900/70 p-8 text-center text-sm text-mist-300 ring-1 ring-inset ring-white/6">{getApiErrorMessage(reports.error, "Reports didn't load.")}</p>
      ) : rows.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-card bg-ink-900/70 px-6 py-20 text-center ring-1 ring-inset ring-white/6">
          <span className={cn("grid size-12 place-items-center rounded-full", status === "pending" ? "bg-signal/12 text-signal" : "bg-white/5 text-mist-400")}>
            <Icon name={status === "pending" ? "check" : "flag"} weight="bold" className="size-5" />
          </span>
          <p className="font-semibold">{status === "pending" ? "Nothing waiting" : `No ${status} reports`}</p>
          <p className="max-w-sm text-sm text-mist-400">{status === "pending" ? "New reports from the community land here." : "Try clearing a filter."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="grid gap-3 lg:sticky lg:top-24">
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
              {rows.map((report) => {
                const meta = contentMeta(report.contentType);
                const wait = report.status === "pending" ? waited(report.createdAt, 24) : null;
                const active = report.id === selected?.id;
                return (
                  <li key={report.id}>
                    <button
                      type="button"
                      onClick={() => set({ report: report.id, page: state.page })}
                      aria-current={active || undefined}
                      className={cn(
                        "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3.5 py-3 text-left ring-1 ring-inset transition-colors",
                        active ? "bg-lavender-400/8 ring-lavender-400/40" : "ring-white/6 hover:bg-white/3",
                      )}
                    >
                      <span className="grid size-9 place-items-center rounded-lg bg-white/4 text-mist-400">
                        <Icon name={meta.icon} className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {statusLabel(report.type)} <span className="text-mist-500">· {meta.label.toLowerCase()}</span>
                        </span>
                        <span className="block truncate text-xs text-mist-500">{reportedSummary(report)}</span>
                      </span>
                      {wait ? (
                        <span className={cn("font-mono text-xs tabular-nums", wait.overdue ? "text-danger" : "text-mist-400")}>{wait.label}</span>
                      ) : (
                        <span className="font-mono text-[0.68rem] text-mist-500">{formatDate(report.createdAt)}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-1">
                <span className="font-mono text-xs text-mist-500">
                  Page {query.page} / {totalPages}
                </span>
                <span className="flex gap-2">
                  <Button tone="outline" size="xs" icon="arrowLeft" disabled={query.page <= 1} onClick={() => set({ page: String(query.page - 1), report: "" })}>
                    <span className="sr-only">Previous</span>
                  </Button>
                  <Button tone="outline" size="xs" icon="arrowRight" disabled={query.page >= totalPages} onClick={() => set({ page: String(query.page + 1), report: "" })}>
                    <span className="sr-only">Next</span>
                  </Button>
                </span>
              </div>
            )}
          </div>
          {selected && (
            <ReportCase
              key={selected.id}
              report={selected}
              onDecided={() => {
                const next = rows.find((report) => report.id !== selected.id);
                set({ report: next?.id ?? "", page: state.page });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
