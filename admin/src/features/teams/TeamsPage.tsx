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
import { formatDate, statusLabel } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { useTeams } from "./hooks";
import type { TeamQuery, TeamRow } from "./types";

const DEFAULTS = { search: "", status: "", reported: "", sort: "newest", page: "1" };
const LIMIT = 25;

const column = createColumnHelper<TeamRow>();
const columns = [
  column.display({
    id: "team",
    header: "Team",
    cell: ({ row: { original: team } }) => (
      <Link to={`/teams/${team.id}`} className="flex min-w-0 items-center gap-3">
        <Avatar src={team.logo ?? undefined} name={team.name} size="sm" tone="ink" shape="square" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-mist-50">{team.name}</span>
          <span className="block truncate font-mono text-[0.7rem] text-mist-500">{[team.region, team.country].filter(Boolean).join(" · ") || "No region"}</span>
        </span>
      </Link>
    ),
  }),
  column.display({ id: "owner", header: "Owner", cell: ({ row }) => <OwnerCell owner={row.original.owner} /> }),
  column.display({
    id: "members",
    header: "Members",
    meta: { align: "right" },
    cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.membersCount}</span>,
  }),
  column.display({ id: "level", header: "Level", cell: ({ row }) => <span className="text-xs text-mist-300">{statusLabel(row.original.level)}</span> }),
  column.display({
    id: "status",
    header: "Status",
    cell: ({ row: { original: team } }) => (
      <span className="flex flex-wrap gap-1">
        {team.isBanned && <Stamp tone="danger">Banned</Stamp>}
        {team.reportCount > 0 && <Stamp tone="danger">{team.reportCount} {team.reportCount === 1 ? "report" : "reports"}</Stamp>}
        {!team.isBanned && team.reportCount === 0 && <span className="text-xs text-mist-500">Good standing</span>}
      </span>
    ),
  }),
  column.display({ id: "created", header: "Created", cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDate(row.original.createdAt)}</span> }),
];

export function TeamsPage() {
  useDocumentTitle("Teams");
  const [state, set] = useQueryState(DEFAULTS);
  const query: TeamQuery = {
    page: Math.max(1, Number(state.page) || 1),
    limit: LIMIT,
    search: state.search || undefined,
    status: (state.status || undefined) as TeamQuery["status"],
    reported: state.reported === "true" ? "true" : undefined,
    sort: state.sort as TeamQuery["sort"],
  };
  const teams = useTeams(query);
  const summary = usePeopleSummary().data?.teams;
  const segment = state.status === "banned" ? "banned" : state.reported ? "reported" : null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Teams" refresh={[["admin", "teams"], ["admin", "people"]]} />
      <SegmentStrip
        loading={!summary}
        active={segment}
        onPick={(key) => set({ status: key === "banned" ? "banned" : "", reported: key === "reported" ? "true" : "" })}
        segments={[
          { key: "all", label: "All teams", value: summary?.total, hint: "Every roster" },
          { key: "new", label: "New", value: summary?.new7d, tone: "signal", hint: "Created this week" },
          { key: "reported", label: "Reported", value: summary?.reported, tone: "danger", hint: "Reported at least once" },
          { key: "banned", label: "Banned", value: summary?.banned, tone: "danger", hint: "Hidden and locked" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search teams" className="w-full sm:w-72" />
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
        data={teams.data?.data ?? []}
        getRowId={(team) => team.id}
        rowHref={(team) => `/teams/${team.id}`}
        rowClassName={(team) => team.isBanned && "bg-danger/3"}
        loading={teams.isFetching}
        error={teams.isError ? getApiErrorMessage(teams.error, "Teams didn't load.") : null}
        onRetry={() => void teams.refetch()}
        minWidth="52rem"
        empty={{ icon: "team", title: "No teams match", description: "Try another search or clear a filter." }}
      />
      {teams.data && teams.data.total > 0 && <TableFooter page={query.page} limit={LIMIT} total={teams.data.total} onPage={(page) => set({ page: String(page) })} />}
    </div>
  );
}
