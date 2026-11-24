import { createColumnHelper } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { DataTable } from "@/components/data/DataTable";
import { SearchField } from "@/components/data/SearchField";
import { SegmentStrip } from "@/components/data/SegmentStrip";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { OwnerCell } from "@/features/people/components/OwnerCell";
import { Stamp } from "@/components/record/Stamp";
import { usePeopleSummary } from "@/features/people/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { figure, formatDate, statusLabel } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { useHubs } from "./hooks";
import type { HubQuery, HubRow } from "./types";

const DEFAULTS = { search: "", status: "", reported: "", type: "", visibility: "", sort: "newest", page: "1" };
const LIMIT = 25;

const column = createColumnHelper<HubRow>();
const columns = [
  column.display({
    id: "hub",
    header: "Hub",
    cell: ({ row: { original: hub } }) => (
      <Link to={`/hubs/${hub.id}`} className="flex min-w-0 items-center gap-3">
        <Avatar src={hub.logo ?? undefined} name={hub.name} size="sm" tone="ink" shape="square" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-mist-50">{hub.name}</span>
          <span className="block truncate font-mono text-[0.7rem] text-mist-500">
            {[statusLabel(hub.type), hub.organizationName, hub.region].filter(Boolean).join(" · ")}
          </span>
        </span>
      </Link>
    ),
  }),
  column.display({ id: "owner", header: "Owner", cell: ({ row }) => <OwnerCell owner={row.original.owner} /> }),
  column.display({ id: "members", header: "Members", meta: { align: "right" }, cell: ({ row }) => <span className="font-semibold tabular-nums">{figure(row.original.membersCount)}</span> }),
  column.display({ id: "teams", header: "Teams", meta: { align: "right" }, cell: ({ row }) => <span className="tabular-nums text-mist-200">{figure(row.original.teamsCount)}</span> }),
  column.display({ id: "followers", header: "Followers", meta: { align: "right" }, cell: ({ row }) => <span className="tabular-nums text-mist-200">{figure(row.original.followersCount)}</span> }),
  column.display({
    id: "status",
    header: "Status",
    cell: ({ row: { original: hub } }) => (
      <span className="flex flex-wrap gap-1">
        {hub.visibility === "private" && <Stamp>Private</Stamp>}
        {hub.isBanned && <Stamp tone="danger">Banned</Stamp>}
        {hub.reportCount > 0 && <Stamp tone="danger">{hub.reportCount} {hub.reportCount === 1 ? "report" : "reports"}</Stamp>}
        {!hub.isBanned && hub.reportCount === 0 && hub.visibility !== "private" && <span className="text-xs text-mist-500">Public</span>}
      </span>
    ),
  }),
  column.display({ id: "created", header: "Created", cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDate(row.original.createdAt)}</span> }),
];

export function HubsPage() {
  useDocumentTitle("Hubs");
  const [state, set] = useQueryState(DEFAULTS);
  const query: HubQuery = {
    page: Math.max(1, Number(state.page) || 1),
    limit: LIMIT,
    search: state.search || undefined,
    status: (state.status || undefined) as HubQuery["status"],
    reported: state.reported === "true" ? "true" : undefined,
    type: state.type || undefined,
    visibility: state.visibility || undefined,
    sort: state.sort as HubQuery["sort"],
  };
  const hubs = useHubs(query);
  const summary = usePeopleSummary().data?.hubs;
  const segment = state.status === "banned" ? "banned" : state.reported ? "reported" : state.type === "organization" ? "organizations" : null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Hubs" refresh={[["admin", "hubs"], ["admin", "people"]]} />
      <SegmentStrip
        loading={!summary}
        active={segment}
        onPick={(key) => set({ status: key === "banned" ? "banned" : "", reported: key === "reported" ? "true" : "", type: key === "organizations" ? "organization" : "" })}
        segments={[
          { key: "all", label: "All hubs", value: summary?.total, hint: "Communities and organizations" },
          { key: "new", label: "New", value: summary?.new7d, tone: "signal", hint: "Created this week" },
          { key: "organizations", label: "Organizations", value: summary?.organizations, hint: "Registered businesses" },
          { key: "reported", label: "Reported", value: summary?.reported, tone: "danger", hint: "Reported at least once" },
          { key: "banned", label: "Banned", value: summary?.banned, tone: "danger", hint: "Hidden and locked" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search hubs" className="w-full sm:w-72" />
        <FilterMenu label="Type" value={state.type} onChange={(type) => set({ type })} options={[{ value: "community", label: "Community" }, { value: "organization", label: "Organization" }]} />
        <FilterMenu label="Visibility" value={state.visibility} onChange={(visibility) => set({ visibility })} options={[{ value: "public", label: "Public" }, { value: "private", label: "Private" }]} />
        <FilterMenu label="Status" value={state.status} onChange={(status) => set({ status })} options={[{ value: "active", label: "Active" }, { value: "banned", label: "Banned" }]} />
        <FilterMenu
          label="Sort"
          anyLabel="Newest"
          value={state.sort === "newest" ? "" : state.sort}
          onChange={(sort) => set({ sort: sort || "newest" })}
          options={[
            { value: "oldest", label: "Oldest" },
            { value: "members", label: "Most members" },
            { value: "reports", label: "Most reported" },
          ]}
        />
      </div>
      <DataTable
        columns={columns}
        data={hubs.data?.data ?? []}
        getRowId={(hub) => hub.id}
        rowHref={(hub) => `/hubs/${hub.id}`}
        rowClassName={(hub) => hub.isBanned && "bg-danger/3"}
        loading={hubs.isFetching}
        error={hubs.isError ? getApiErrorMessage(hubs.error, "Hubs didn't load.") : null}
        onRetry={() => void hubs.refetch()}
        minWidth="58rem"
        empty={{ icon: "hub", title: "No hubs match", description: "Try another search or clear a filter." }}
      />
      {hubs.data && hubs.data.total > 0 && <TableFooter page={query.page} limit={LIMIT} total={hubs.data.total} onPage={(page) => set({ page: String(page) })} />}
    </div>
  );
}
