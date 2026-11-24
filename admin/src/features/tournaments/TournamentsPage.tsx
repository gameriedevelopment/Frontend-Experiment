import { createColumnHelper } from "@tanstack/react-table";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { DataTable } from "@/components/data/DataTable";
import { SearchField } from "@/components/data/SearchField";
import { SegmentStrip } from "@/components/data/SegmentStrip";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { CompetitionCell } from "@/features/competitions/components/CompetitionCell";
import { StatusStamp } from "@/features/competitions/components/StatusStamp";
import { formatLabel, money } from "@/features/competitions/format";
import { useCompetitionSummary } from "@/features/competitions/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { useTournaments } from "./hooks";
import type { TournamentQuery, TournamentRow } from "./types";

const DEFAULTS = { search: "", phase: "", source: "", page: "1" };
const LIMIT = 25;

const column = createColumnHelper<TournamentRow>();
const columns = [
  column.display({
    id: "tournament",
    header: "Tournament",
    cell: ({ row: { original: t } }) => (
      <CompetitionCell to={`/tournaments/${t.id}`} name={t.name} image={t.banner ?? t.host.logo} official={t.official} subtitle={[t.game, formatLabel(t.format), t.platform].filter(Boolean).join(" · ")} />
    ),
  }),
  column.display({
    id: "host",
    header: "Host",
    cell: ({ row: { original: t } }) => <span className="block max-w-44 truncate text-sm text-mist-200">{t.official ? "Gamerie" : (t.host.name ?? "—")}</span>,
  }),
  column.display({
    id: "entrants",
    header: "Entrants",
    meta: { align: "right" },
    cell: ({ row: { original: t } }) => (
      <span className="tabular-nums">
        <span className="font-semibold">{t.entrantCount}</span>
        {t.bracketSize ? <span className="text-mist-500"> / {t.bracketSize}</span> : null}
      </span>
    ),
  }),
  column.display({ id: "status", header: "Status", cell: ({ row: { original: t } }) => <StatusStamp status={t.phase} removed={Boolean(t.removedAt)} /> }),
  column.display({ id: "starts", header: "Starts", cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDate(row.original.startsAt)}</span> }),
  column.display({ id: "prize", header: "Prize", meta: { align: "right" }, cell: ({ row }) => <span className="font-mono text-xs text-mist-200">{money(row.original.prize) ?? "—"}</span> }),
];

export function TournamentsPage() {
  useDocumentTitle("Tournaments");
  const [state, set] = useQueryState(DEFAULTS);
  const query: TournamentQuery = {
    page: Math.max(1, Number(state.page) || 1),
    limit: LIMIT,
    search: state.search || undefined,
    phase: state.phase || undefined,
    source: (state.source || undefined) as TournamentQuery["source"],
  };
  const tournaments = useTournaments(query);
  const summary = useCompetitionSummary().data?.tournaments;
  const segment = state.source === "official" ? "official" : state.phase || null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader title="Tournaments" refresh={[["admin", "tournaments"], ["admin", "competitions"]]} />
      <SegmentStrip
        loading={!summary}
        active={segment}
        onPick={(key) => set({ phase: key && key !== "official" && key !== "all" ? key : "", source: key === "official" ? "official" : "" })}
        segments={[
          { key: "all", label: "All", value: summary?.total, hint: "Published" },
          { key: "registration", label: "Registration", value: summary?.registration, hint: "Taking entries" },
          { key: "live", label: "Live", value: summary?.live, tone: "signal", hint: "Matches being played" },
          { key: "completed", label: "Finished", value: summary?.completed, hint: "Champion crowned" },
          { key: "official", label: "Official", value: summary?.official, hint: "Run by Gamerie" },
          { key: "removed", label: "Removed", value: summary?.removed, tone: "danger", hint: "Hidden by an admin" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={state.search} onChange={(search) => set({ search })} placeholder="Search tournaments" className="w-full sm:w-72" />
        <FilterMenu
          label="Status"
          value={state.phase}
          onChange={(phase) => set({ phase })}
          options={[
            { value: "registration", label: "Registration" },
            { value: "check_in", label: "Check-in" },
            { value: "live", label: "Live" },
            { value: "paused", label: "Paused" },
            { value: "completed", label: "Finished" },
            { value: "cancelled", label: "Cancelled" },
            { value: "removed", label: "Removed" },
          ]}
        />
        <FilterMenu label="Run by" value={state.source} onChange={(source) => set({ source })} options={[{ value: "hosted", label: "Players and hubs" }, { value: "official", label: "Gamerie" }]} />
      </div>
      <DataTable
        columns={columns}
        data={tournaments.data?.data ?? []}
        getRowId={(t) => t.id}
        rowHref={(t) => `/tournaments/${t.id}`}
        rowClassName={(t) => Boolean(t.removedAt) && "opacity-60"}
        loading={tournaments.isFetching}
        error={tournaments.isError ? getApiErrorMessage(tournaments.error, "Tournaments didn't load.") : null}
        onRetry={() => void tournaments.refetch()}
        minWidth="56rem"
        empty={{ icon: "trophy", title: "No tournaments match", description: "Try another search or clear a filter." }}
      />
      {tournaments.data && tournaments.data.total > 0 && <TableFooter page={query.page} limit={LIMIT} total={tournaments.data.total} onPage={(page) => set({ page: String(page) })} />}
    </div>
  );
}
