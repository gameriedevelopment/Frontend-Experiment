import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DataTable } from "@/components/data/DataTable";
import { SearchField } from "@/components/data/SearchField";
import { SegmentStrip } from "@/components/data/SegmentStrip";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { getApiErrorMessage } from "@/lib/errors";
import { figure, formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { getReferralSummary, listReferralCodes, referralKey } from "./api";
import { CreateReferralDialog } from "./components/CreateReferralDialog";
import { ReferralStatusStamp } from "./components/ReferralStatusStamp";
import type { ReferralCode, ReferralStatus } from "./types";

const DEFAULTS = { search: "", status: "", page: "1" };
const LIMIT = 20;

const column = createColumnHelper<ReferralCode>();
const columns = [
  column.display({
    id: "code", header: "Code",
    cell: ({ row: { original: record } }) => (
      <Link to={`/referrals/${record.id}`} className="block min-w-0">
        <span className="block max-w-64 truncate font-medium text-mist-50">{record.code}</span>
        <span className="mt-0.5 block max-w-64 truncate text-xs text-mist-400">{record.source}</span>
      </Link>
    ),
  }),
  column.display({ id: "status", header: "Status", cell: ({ row }) => <ReferralStatusStamp record={row.original} /> }),
  column.display({ id: "signups", header: "Sign-ups", meta: { align: "right" }, cell: ({ row }) => <span className="tabular-nums">{figure(row.original.signups)}</span> }),
  column.display({ id: "due", header: "Eligible unpaid", meta: { align: "right" }, cell: ({ row }) => <span className="tabular-nums">{figure(row.original.eligibleUnpaid)}</span> }),
  column.display({ id: "paid", header: "Paid", meta: { align: "right" }, cell: ({ row }) => <span className="tabular-nums">{figure(row.original.paid)}</span> }),
  column.display({
    id: "expiry", header: "Expiry",
    cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{row.original.expiresAt ? formatDate(row.original.expiresAt) : "No expiry"}</span>,
  }),
];

export function ReferralsPage() {
  useDocumentTitle("Referrals");
  const [state, set] = useQueryState(DEFAULTS);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const page = Math.max(1, Math.floor(Number(state.page)) || 1);
  const statuses: ReferralStatus[] = ["active", "inactive", "expired"];
  const status = statuses.find((item) => item === state.status);
  const query = { page, limit: LIMIT, search: state.search || undefined, status };
  const summary = useQuery({ queryKey: [...referralKey, "summary"], queryFn: getReferralSummary });
  const list = useQuery({ queryKey: [...referralKey, "list", query], queryFn: () => listReferralCodes(query), placeholderData: keepPreviousData });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Referrals" refresh={[referralKey]} actions={<Button size="sm" icon="plus" onClick={() => setCreating(true)}>Create referral code</Button>} />
      <SegmentStrip
        loading={summary.isLoading}
        active={status ?? null}
        onPick={(key) => set({ status: key && key !== "all" ? key : "" })}
        segments={[
          { key: "all", label: "All", value: summary.data?.total, hint: "Every code" },
          { key: "active", label: "Active", value: summary.data?.active, tone: "signal", hint: "Taking sign-ups" },
          { key: "inactive", label: "Inactive", value: summary.data?.inactive, hint: "Switched off" },
          { key: "expired", label: "Expired", value: summary.data?.expired, hint: "Past their end date" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search code or source" className="w-full sm:w-72" />
      </div>
      <DataTable columns={columns} data={list.data?.data ?? []} getRowId={(row) => row.id} rowHref={(row) => `/referrals/${row.id}`}
        loading={list.isFetching} error={list.isError ? getApiErrorMessage(list.error, "Referral codes didn't load.") : null}
        onRetry={() => void list.refetch()} minWidth="51rem"
        empty={{ icon: "gift", title: status || state.search ? "No referral codes match" : "No referral codes yet", description: status || state.search ? "Try another search or clear the status filter." : undefined }}
      />
      {list.data && list.data.total > LIMIT && <TableFooter page={page} limit={LIMIT} total={list.data.total} onPage={(next) => set({ page: String(next) })} />}
      {creating && <CreateReferralDialog onClose={() => setCreating(false)} onCreated={(id) => {
        toast.success("Referral code created");
        void client.invalidateQueries({ queryKey: referralKey });
        navigate(`/referrals/${id}`);
      }} />}
    </div>
  );
}
