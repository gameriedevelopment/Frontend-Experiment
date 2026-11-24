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
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { useLeagues } from "./hooks";
import type { LeagueQuery, LeagueRow } from "./types";

const DEFAULTS = { search: "", status: "", source: "", page: "1" };
const LIMIT = 25;

const column = createColumnHelper<LeagueRow>();
const columns = [
  column.display({
    id: "league",
    header: "League",
    cell: ({ row: { original: league } }) => (
      <CompetitionCell
        to={`/leagues/${league.id}`}
        name={league.name}
        image={league.logo ?? league.banner}
        official={league.official}
        subtitle={[league.game.name, league.platform, league.entrantType === "team" ? "Teams" : "Players"].filter(Boolean).join(" · ")}
      />
    ),
  }),
  column.display({ id: "host", header: "Host", cell: ({ row }) => <span className="block max-w-44 truncate text-sm text-mist-200">{row.original.official ? "Gamerie" : row.original.host.name}</span> }),
  column.display({
    id: "season",
    header: "Season",
    cell: ({ row: { original: league } }) =>
      league.season ? (
        <span className="whitespace-nowrap text-sm">
          <span className="font-semibold">S{league.season.number}</span>
          <span className="ml-2 font-mono text-xs text-mist-500">
            {league.season.participantCount}
            {league.season.maxParticipants ? ` / ${league.season.maxParticipants}` : ""} entered
          </span>
        </span>
      ) : (
        <span className="text-xs text-mist-500">No season yet</span>
      ),
  }),
  column.display({
    id: "status",
    header: "Status",
    cell: ({ row: { original: league } }) => (
      <span className="flex flex-wrap gap-1">
        <StatusStamp status={league.season?.status ?? league.status} removed={Boolean(league.removed)} />
        {(league.openDisputes ?? 0) > 0 && <Stamp tone="danger">{league.openDisputes} disputed</Stamp>}
      </span>
    ),
  }),
  column.display({
    id: "dates",
    header: "Season runs",
    cell: ({ row: { original: league } }) => (
      <span className="whitespace-nowrap font-mono text-xs text-mist-300">{league.season ? `${formatDate(league.season.startsAt)} → ${formatDate(league.season.endsAt)}` : "—"}</span>
    ),
  }),
];

export function LeaguesPage() {
  useDocumentTitle("Leagues");
  const [state, set] = useQueryState(DEFAULTS);
  const query: LeagueQuery = {
    page: Math.max(1, Number(state.page) || 1),
    limit: LIMIT,
    search: state.search || undefined,
    status: state.status || undefined,
    source: (state.source || undefined) as LeagueQuery["source"],
  };
  const leagues = useLeagues(query);
  const summary = useCompetitionSummary().data?.leagues;
  const segment = state.source === "official" ? "official" : state.status || null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Leagues" refresh={[["admin", "leagues"], ["admin", "competitions"]]} />
      <SegmentStrip
        loading={!summary}
        active={segment}
        onPick={(key) => set({ status: key && key !== "official" && key !== "all" ? key : "", source: key === "official" ? "official" : "" })}
        segments={[
          { key: "all", label: "All", value: summary?.total, hint: "Published" },
          { key: "registration", label: "Registration", value: summary?.registration, hint: "Next season filling" },
          { key: "in_progress", label: "Live", value: summary?.running, tone: "signal", hint: "Weeks being played" },
          { key: "completed", label: "Finished", value: summary?.completed, hint: "Season complete" },
          { key: "official", label: "Official", value: summary?.official, hint: "Run by Gamerie" },
          { key: "removed", label: "Removed", value: summary?.removed, tone: "danger", hint: "Hidden" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search leagues" className="w-full sm:w-72" />
        <FilterMenu
          label="Season"
          value={state.status}
          onChange={(status) => set({ status })}
          options={[
            { value: "registration", label: "Registration" },
            { value: "in_progress", label: "Live" },
            { value: "playoffs", label: "Playoffs" },
            { value: "completed", label: "Finished" },
            { value: "removed", label: "Removed" },
          ]}
        />
        <FilterMenu label="Run by" value={state.source} onChange={(source) => set({ source })} options={[{ value: "hosted", label: "Hubs" }, { value: "official", label: "Gamerie" }]} />
      </div>
      <DataTable
        columns={columns}
        data={leagues.data?.data ?? []}
        getRowId={(league) => league.id}
        rowHref={(league) => `/leagues/${league.id}`}
        rowClassName={(league) => Boolean(league.removed) && "opacity-60"}
        loading={leagues.isFetching}
        error={leagues.isError ? getApiErrorMessage(leagues.error, "Leagues didn't load.") : null}
        onRetry={() => void leagues.refetch()}
        minWidth="56rem"
        empty={{ icon: "leagues", title: "No leagues match", description: "Try another search or clear a filter." }}
      />
      {leagues.data && leagues.data.total > 0 && <TableFooter page={query.page} limit={LIMIT} total={leagues.data.total} onPage={(page) => set({ page: String(page) })} />}
    </div>
  );
}
