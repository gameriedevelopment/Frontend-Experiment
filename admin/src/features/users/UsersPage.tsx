import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { DataTable } from "@/components/data/DataTable";
import { SearchField } from "@/components/data/SearchField";
import { SegmentStrip } from "@/components/data/SegmentStrip";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePeopleSummary } from "@/features/people/hooks";
import { Stamp } from "@/components/record/Stamp";
import { downloadCsv } from "@/lib/csv";
import { getApiErrorMessage } from "@/lib/errors";
import { figure, formatDate } from "@/lib/format";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { listUsers } from "./api";
import { useUsers } from "./hooks";
import type { UserQuery, UserRow } from "./types";

const DEFAULTS = { search: "", status: "", verified: "", reported: "", recent: "", sort: "newest", page: "1" };
const LIMIT = 25;

const column = createColumnHelper<UserRow>();
const columns = [
  column.display({
    id: "player",
    header: "Player",
    cell: ({ row: { original: user } }) => (
      <Link to={`/users/${user.id}`} className="flex min-w-0 items-center gap-3">
        <Avatar src={user.profileImage ?? undefined} name={user.username} size="sm" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-mist-50">{user.username}</span>
          <span className="block truncate font-mono text-[0.7rem] text-mist-500">{[user.gamerieId, user.email].filter(Boolean).join(" · ")}</span>
        </span>
      </Link>
    ),
  }),
  column.display({
    id: "status",
    header: "Status",
    cell: ({ row: { original: user } }) => (
      <span className="flex flex-wrap gap-1">
        {user.isBanned && <Stamp tone="danger">Banned</Stamp>}
        {user.role?.toLowerCase() === "admin" && <Stamp tone="lavender">Admin</Stamp>}
        {user.reportCount > 0 && <Stamp tone="danger">{user.reportCount} {user.reportCount === 1 ? "report" : "reports"}</Stamp>}
        {!user.emailVerified && <Stamp>Unverified</Stamp>}
        {!user.isBanned && user.emailVerified && user.reportCount === 0 && user.role?.toLowerCase() !== "admin" && <span className="text-xs text-mist-500">Good standing</span>}
      </span>
    ),
  }),
  column.display({
    id: "level",
    header: "Level",
    cell: ({ row: { original: user } }) => (
      <span className="whitespace-nowrap">
        <span className="font-semibold tabular-nums">Lv {user.progression.level}</span>
        <span className="ml-2 font-mono text-[0.7rem] text-mist-500">{figure(user.progression.totalGp)} GP</span>
      </span>
    ),
  }),
  column.display({
    id: "profile",
    header: "Profile",
    cell: ({ row: { original: user } }) => {
      const score = user.profileCompletion?.score ?? 0;
      return (
        <span className="flex items-center gap-2" title={`${score}% complete`}>
          <span className="h-1 w-14 overflow-hidden rounded-full bg-white/8">
            <span className={score >= 100 ? "block h-full bg-signal" : "block h-full bg-lavender-400"} style={{ width: `${score}%` }} />
          </span>
          <span className="font-mono text-[0.7rem] tabular-nums text-mist-400">{score}%</span>
        </span>
      );
    },
  }),
  column.display({ id: "joined", header: "Joined", cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDate(row.original.createdAt)}</span> }),
  column.display({
    id: "active",
    header: "Last active",
    cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{row.original.lastLogin ? timeAgo(row.original.lastLogin) : "Never"}</span>,
  }),
  column.display({
    id: "source",
    header: "Came from",
    cell: ({ row: { original: user } }) =>
      user.referredBy ? (
        <span className="flex min-w-0 max-w-52 items-center gap-2" title={user.referredBy.name}>
          <span className="type-label shrink-0 rounded-md bg-white/5 px-1.5 py-1 text-[0.55rem] text-mist-400 ring-1 ring-inset ring-white/8">
            {user.referredBy.type === "partner" ? "Code" : "Invite"}
          </span>
          <span className="truncate text-xs text-mist-200">{user.referredBy.name}</span>
        </span>
      ) : (
        <span className="text-xs text-mist-500">Direct</span>
      ),
  }),
];

export function UsersPage() {
  useDocumentTitle("Users");
  const [state, set] = useQueryState(DEFAULTS);
  const query: UserQuery = {
    page: Math.max(1, Number(state.page) || 1),
    limit: LIMIT,
    search: state.search || undefined,
    status: (state.status || undefined) as UserQuery["status"],
    verified: (state.verified || undefined) as UserQuery["verified"],
    reported: state.reported === "true" ? "true" : undefined,
    recent: (state.recent || undefined) as UserQuery["recent"],
    sort: state.sort as UserQuery["sort"],
  };
  const users = useUsers(query);
  const summary = usePeopleSummary().data?.users;
  const [exporting, setExporting] = useState(false);

  const segment =
    state.status === "banned" ? "banned" : state.reported ? "reported" : state.verified === "unverified" ? "unverified" : state.recent === "joined" ? "new" : state.recent === "active" ? "active" : null;
  const pickSegment = (key: string | null) =>
    set({
      status: key === "banned" ? "banned" : "",
      reported: key === "reported" ? "true" : "",
      verified: key === "unverified" ? "unverified" : "",
      recent: key === "new" ? "joined" : key === "active" ? "active" : "",
    });

  const exportCsv = async () => {
    setExporting(true);
    try {
      const rows: UserRow[] = [];
      for (let page = 1; page <= 5; page += 1) {
        const result = await listUsers({ ...query, page, limit: 100 });
        rows.push(...result.data);
        if (rows.length >= result.total) break;
      }
      downloadCsv(
        "gamerie-users",
        ["Gamerie ID", "Username", "Email", "Status", "Email verified", "Reports", "Level", "GP", "Profile %", "Joined", "Last active", "Came from"],
        rows.map((user) => [
          user.gamerieId,
          user.username,
          user.email,
          user.isBanned ? "Banned" : "Active",
          user.emailVerified ? "Yes" : "No",
          user.reportCount,
          user.progression.level,
          user.progression.totalGp,
          user.profileCompletion?.score ?? 0,
          user.createdAt,
          user.lastLogin,
          user.referredBy?.name ?? "Direct",
        ]),
      );
    } catch (error) {
      toast.error("Export didn't finish", getApiErrorMessage(error, "Try again in a moment."));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        title="Users"
        refresh={[["admin", "users"], ["admin", "people"]]}
        actions={
          <Button tone="outline" size="sm" icon="download" disabled={exporting || !users.data?.total} onClick={() => void exportCsv()}>
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        }
      />
      <SegmentStrip
        loading={!summary}
        active={segment}
        onPick={pickSegment}
        segments={[
          { key: "all", label: "All players", value: summary?.total, hint: "Everyone signed up" },
          { key: "new", label: "New", value: summary?.new7d, tone: "signal", hint: "Joined this week" },
          { key: "active", label: "Active", value: summary?.active7d, hint: "Signed in this week" },
          { key: "unverified", label: "Unverified", value: summary?.unverified, hint: "Email not confirmed" },
          { key: "reported", label: "Reported", value: summary?.reported, tone: "danger", hint: "Reported at least once" },
          { key: "banned", label: "Banned", value: summary?.banned, tone: "danger", hint: "Locked out" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search name, email or GMR ID" className="w-full sm:w-80" />
        <FilterMenu label="Status" value={state.status} onChange={(status) => set({ status })} options={[{ value: "active", label: "Active" }, { value: "banned", label: "Banned" }]} />
        <FilterMenu label="Email" value={state.verified} onChange={(verified) => set({ verified })} options={[{ value: "verified", label: "Confirmed" }, { value: "unverified", label: "Not confirmed" }]} />
        <FilterMenu
          label="Sort"
          anyLabel="Newest"
          value={state.sort === "newest" ? "" : state.sort}
          onChange={(sort) => set({ sort: sort || "newest" })}
          options={[
            { value: "oldest", label: "Oldest" },
            { value: "active", label: "Last active" },
            { value: "gp", label: "Most GP" },
            { value: "reports", label: "Most reported" },
          ]}
        />
      </div>
      <DataTable
        columns={columns}
        data={users.data?.data ?? []}
        getRowId={(user) => user.id}
        rowHref={(user) => `/users/${user.id}`}
        rowClassName={(user) => user.isBanned && "bg-danger/3"}
        loading={users.isFetching}
        error={users.isError ? getApiErrorMessage(users.error, "Players didn't load.") : null}
        onRetry={() => void users.refetch()}
        minWidth="62rem"
        empty={{ icon: "user", title: "No players match", description: "Try another search or clear a filter." }}
      />
      {users.data && users.data.total > 0 && <TableFooter page={query.page} limit={LIMIT} total={users.data.total} onPage={(page) => set({ page: String(page) })} />}
    </div>
  );
}
