import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/data/DataTable";
import { SearchField } from "@/components/data/SearchField";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { downloadCsv } from "@/lib/csv";
import { getApiErrorMessage } from "@/lib/errors";
import { describeAction, formatDateTime } from "@/lib/format";
import { entityPath, isEntityKind } from "@/lib/paths";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { auditKey, listAudit } from "./api";
import { AuditFilterDialog, dateParam, validId } from "./components/AuditFilterDialog";
import { AuditRecordDialog } from "./components/AuditRecordDialog";
import type { AuditFilters, AuditQuery, AuditRecord } from "./types";

const FILTERS: AuditFilters = { actorId: "", targetId: "", action: "", from: "", to: "" };
const DEFAULTS = { ...FILTERS, search: "", targetType: "", page: "1" };
const LIMIT = 25;
const TARGETS = [
  { value: "user", label: "Users" },
  { value: "team", label: "Teams" },
  { value: "hub", label: "Hubs" },
  { value: "tournament", label: "Tournaments" },
  { value: "ladder", label: "Ladders" },
  { value: "league", label: "Leagues" },
  { value: "challenge", label: "Challenges" },
  { value: "recorded_match", label: "Recorded matches" },
  { value: "post", label: "Posts" },
  { value: "comment", label: "Comments" },
  { value: "game", label: "Games" },
  { value: "achievement", label: "Achievements" },
  { value: "referral_code", label: "Referral codes" },
  { value: "user_referral", label: "Referral sign-ups" },
  { value: "admin_member", label: "Administrators" },
  { value: "admin_invite", label: "Invitations" },
];

const column = createColumnHelper<AuditRecord>();
function auditColumns(open: (record: AuditRecord) => void) {
  return [
    column.display({ id: "action", header: "Action", cell: ({ row: { original: record } }) => (
      <button type="button" className="block max-w-56 truncate text-left font-medium text-mist-50 hover:text-lavender-200" onClick={() => open(record)}>
        {describeAction(record.action)}
      </button>
    ) }),
    column.display({ id: "actor", header: "Administrator", cell: ({ row }) => <span className="block max-w-40 truncate">{row.original.actor}</span> }),
    column.display({ id: "target", header: "Target", cell: ({ row: { original: record } }) => {
      const label = describeAction(record.targetType);
      const body = (
        <>
          <span className="block">{label}</span>
          <span className="block font-mono text-xs text-mist-500" title={record.targetId}>{record.targetId.slice(0, 8)}</span>
        </>
      );
      return isEntityKind(record.targetType)
        ? <Link to={entityPath(record.targetType, record.targetId)} className="block hover:text-lavender-200">{body}</Link>
        : body;
    } }),
    column.display({ id: "reason", header: "Reason", cell: ({ row }) => <span className="block max-w-72 truncate text-mist-300">{row.original.reason || "—"}</span> }),
    column.display({ id: "when", header: "Recorded", cell: ({ row }) => (
      <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDateTime(row.original.createdAt)}</span>
    ) }),
  ];
}

export function AuditPage() {
  useDocumentTitle("Audit log");
  const [state, set] = useQueryState(DEFAULTS);
  const [selected, setSelected] = useState<AuditRecord | null>(null);
  const [filtering, setFiltering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const page = Math.max(1, Number.parseInt(state.page, 10) || 1);
  const query: AuditQuery = {
    page,
    limit: LIMIT,
    search: state.search.trim().slice(0, 100) || undefined,
    actorId: validId(state.actorId) ? state.actorId : undefined,
    targetId: validId(state.targetId) ? state.targetId : undefined,
    targetType: state.targetType.trim().slice(0, 40) || undefined,
    action: state.action.trim().slice(0, 80) || undefined,
    from: dateParam(state.from),
    to: dateParam(state.to),
  };
  const log = useQuery({ queryKey: [...auditKey, "list", query], queryFn: () => listAudit(query), placeholderData: keepPreviousData });
  const activeFilters = [query.actorId, query.targetId, query.action, query.from, query.to].filter(Boolean).length;
  const options = state.targetType && !TARGETS.some((target) => target.value === state.targetType)
    ? [...TARGETS, { value: state.targetType, label: describeAction(state.targetType) }]
    : TARGETS;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows: AuditRecord[] = [];
      let total = 0;
      for (let page = 1; page <= 5; page += 1) {
        const result = await listAudit({ ...query, page, limit: 100 });
        rows.push(...result.data);
        total = result.total;
        if (!result.data.length || rows.length >= total) break;
      }
      downloadCsv("gamerie-audit", ["Recorded", "Administrator", "Administrator ID", "Action", "Target type", "Target ID", "Reason"],
        rows.map((row) => [row.createdAt, row.actor, row.actorId, row.action, row.targetType, row.targetId, row.reason]));
      if (total > rows.length) toast.info(`Exported ${rows.length} records`, "Use filters to export a smaller range.");
      else toast.success("Audit log exported");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The audit log didn't export."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Audit log" refresh={[auditKey]} actions={
        <Button tone="outline" size="sm" icon="download" disabled={exporting || !log.data?.total || log.isFetching || log.isError} onClick={() => void exportCsv()}>
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      } />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search audit events" className="w-full sm:w-72" />
        <FilterMenu label="Target type" value={state.targetType} options={options} onChange={(targetType) => set({ targetType, targetId: "" })} />
        <Button size="xs" tone="outline" onClick={() => setFiltering(true)}>{activeFilters ? `More filters · ${activeFilters}` : "More filters"}</Button>
        {(activeFilters > 0 || query.targetType) && <Button size="xs" tone="ghost" onClick={() => set({ ...FILTERS, targetType: "" })}>Clear filters</Button>}
      </div>
      <DataTable columns={auditColumns(setSelected)} data={log.data?.data ?? []} getRowId={(row) => row.id} onRowClick={setSelected}
        loading={log.isFetching} error={log.isError ? getApiErrorMessage(log.error, "The audit log didn't load.") : null}
        onRetry={() => void log.refetch()} minWidth="58rem"
        empty={{ icon: "audit", title: "No audit events", description: state.search || activeFilters || query.targetType ? "Try another search or clear a filter." : undefined }}
      />
      {log.data && log.data.total > LIMIT && <TableFooter page={page} limit={LIMIT} total={log.data.total} onPage={(next) => set({ page: String(next) })} />}
      {filtering && <AuditFilterDialog filters={state} onClose={() => setFiltering(false)} onApply={(filters) => {
        set(filters);
        setFiltering(false);
      }} />}
      {selected && <AuditRecordDialog record={selected} onClose={() => setSelected(null)} onFilter={() => {
        set({ ...FILTERS, search: "", targetType: selected.targetType, targetId: selected.targetId });
        setSelected(null);
      }} />}
    </div>
  );
}
