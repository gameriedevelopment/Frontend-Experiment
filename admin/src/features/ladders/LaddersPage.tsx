import { createColumnHelper } from "@tanstack/react-table";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { DataTable } from "@/components/data/DataTable";
import { SearchField } from "@/components/data/SearchField";
import { SegmentStrip } from "@/components/data/SegmentStrip";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stamp } from "@/components/record/Stamp";
import { CompetitionCell } from "@/features/competitions/components/CompetitionCell";
import { StatusStamp } from "@/features/competitions/components/StatusStamp";
import { useCompetitionSummary } from "@/features/competitions/hooks";
import { OwnerCell } from "@/features/people/components/OwnerCell";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { useLadders } from "./hooks";
import type { LadderQuery, LadderRow } from "./types";

const DEFAULTS = { search: "", status: "", source: "", page: "1" };
const LIMIT = 25;

const column = createColumnHelper<LadderRow>();
const columns = [
  column.display({
    id: "ladder",
    header: "Ladder",
    cell: ({ row: { original: ladder } }) => (
      <CompetitionCell
        to={`/ladders/${ladder.id}`}
        name={ladder.name}
        image={ladder.banner}
        official={ladder.official}
        subtitle={[ladder.game, ladder.platform, ladder.entrantType === "team" ? "Teams" : "Players"].filter(Boolean).join(" · ")}
      />
    ),
  }),
  column.display({
    id: "organizer",
    header: "Organizer",
    cell: ({ row: { original: ladder } }) =>
      ladder.official ? (
        <span className="text-sm text-mist-200">Gamerie</span>
      ) : (
        <OwnerCell owner={ladder.organizer && { id: ladder.organizer.id, username: ladder.organizer.username, profileImage: ladder.organizer.avatar }} />
      ),
  }),
  column.display({
    id: "entrants",
    header: "Entrants",
    meta: { align: "right" },
    cell: ({ row: { original: ladder } }) => (
      <span className="tabular-nums">
        <span className="font-semibold">{ladder.participantCount}</span>
        {ladder.maxParticipants ? <span className="text-mist-500"> / {ladder.maxParticipants}</span> : null}
      </span>
    ),
  }),
  column.display({
    id: "status",
    header: "Status",
    cell: ({ row: { original: ladder } }) => (
      <span className="flex flex-wrap gap-1">
        <StatusStamp status={ladder.status} removed={Boolean(ladder.removed)} />
        {ladder.openDisputes > 0 && <Stamp tone="danger">{ladder.openDisputes} disputed</Stamp>}
      </span>
    ),
  }),
  column.display({
    id: "dates",
    header: "Runs",
    cell: ({ row: { original: ladder } }) => (
      <span className="whitespace-nowrap font-mono text-xs text-mist-300">
        {formatDate(ladder.startsAt)} → {formatDate(ladder.endsAt)}
      </span>
    ),
  }),
];

export function LaddersPage() {
  useDocumentTitle("Ladders");
  const [state, set] = useQueryState(DEFAULTS);
  const query: LadderQuery = {
    page: Math.max(1, Number(state.page) || 1),
    limit: LIMIT,
    search: state.search || undefined,
    status: state.status || undefined,
    source: (state.source || undefined) as LadderQuery["source"],
  };
  const ladders = useLadders(query);
  const summary = useCompetitionSummary().data?.ladders;
  const segment = state.source === "official" ? "official" : state.status || null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Ladders" refresh={[["admin", "ladders"], ["admin", "competitions"]]} />
      <SegmentStrip
        loading={!summary}
        active={segment}
        onPick={(key) => set({ status: key && key !== "official" && key !== "all" ? key : "", source: key === "official" ? "official" : "" })}
        segments={[
          { key: "all", label: "All", value: summary?.total, hint: "Published" },
          { key: "upcoming", label: "Upcoming", value: summary?.upcoming, hint: "Taking entries" },
          { key: "in_progress", label: "Live", value: summary?.running, tone: "signal", hint: "Challenges open" },
          { key: "completed", label: "Finished", value: summary?.completed, hint: "Final table set" },
          { key: "official", label: "Official", value: summary?.official, hint: "Run by Gamerie" },
          { key: "removed", label: "Removed", value: summary?.removed, tone: "danger", hint: "Hidden" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search ladders" className="w-full sm:w-72" />
        <FilterMenu
          label="Status"
          value={state.status}
          onChange={(status) => set({ status })}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "in_progress", label: "Live" },
            { value: "completed", label: "Finished" },
            { value: "archived", label: "Archived" },
            { value: "removed", label: "Removed" },
          ]}
        />
        <FilterMenu label="Run by" value={state.source} onChange={(source) => set({ source })} options={[{ value: "hosted", label: "Players and hubs" }, { value: "official", label: "Gamerie" }]} />
      </div>
      <DataTable
        columns={columns}
        data={ladders.data?.data ?? []}
        getRowId={(ladder) => ladder.id}
        rowHref={(ladder) => `/ladders/${ladder.id}`}
        rowClassName={(ladder) => Boolean(ladder.removed) && "opacity-60"}
        loading={ladders.isFetching}
        error={ladders.isError ? getApiErrorMessage(ladders.error, "Ladders didn't load.") : null}
        onRetry={() => void ladders.refetch()}
        minWidth="56rem"
        empty={{ icon: "ladders", title: "No ladders match", description: "Try another search or clear a filter." }}
      />
      {ladders.data && ladders.data.total > 0 && <TableFooter page={query.page} limit={LIMIT} total={ladders.data.total} onPage={(page) => set({ page: String(page) })} />}
    </div>
  );
}
