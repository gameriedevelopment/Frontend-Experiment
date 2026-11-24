import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/data/DataTable";
import { SearchField } from "@/components/data/SearchField";
import { SegmentStrip } from "@/components/data/SegmentStrip";
import { TableFooter } from "@/components/data/TableFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { Stamp } from "@/components/record/Stamp";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Segmented } from "@/components/ui/Segmented";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useQueryState } from "@/lib/useQueryState";
import { getChallengeSummary, listChallenges, listOrganiserResults } from "./api";
import { scores, sides, STATUS, STATUS_ORDER } from "./labels";
import { OrganiserResultDialog } from "./OrganiserResultDialog";
import type { Challenge, ChallengeQuery, ChallengeStatus, OrganiserResult } from "./types";

const DEFAULTS = { view: "", search: "", status: "", type: "", reported: "", page: "1" };
const LIMIT = 25;
const root = ["admin", "challenges"] as const;

const column = createColumnHelper<Challenge>();
const columns = [
  column.display({
    id: "match",
    header: "Match",
    cell: ({ row: { original: challenge } }) => {
      const [first, second] = sides(challenge);
      return (
        <Link to={`/challenges/${challenge.id}`} className="block min-w-0">
          <span className="flex min-w-0 items-baseline gap-2 font-medium text-mist-50">
            <span className="truncate">{first.name}</span>
            <span className="shrink-0 text-xs font-normal text-mist-500">vs</span>
            <span className="truncate">{second.name}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-mist-400">
            {[challenge.game, challenge.type === "team" ? `Teams${challenge.teamSize ? ` · ${challenge.teamSize}v${challenge.teamSize}` : ""}` : "Players", challenge.format].filter(Boolean).join(" · ")}
          </span>
        </Link>
      );
    },
  }),
  column.display({
    id: "when",
    header: "When",
    cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDateTime(row.original.scheduledDate)}</span>,
  }),
  column.display({
    id: "status",
    header: "Status",
    cell: ({ row: { original: challenge } }) => (
      <span className="flex flex-wrap gap-1">
        <Stamp tone={STATUS[challenge.status]?.tone ?? "mist"}>{STATUS[challenge.status]?.label ?? challenge.status}</Stamp>
        {challenge.reportCount > 0 && (
          <Stamp tone="danger" icon="flag">
            {challenge.reportCount}
          </Stamp>
        )}
      </span>
    ),
  }),
  column.display({
    id: "result",
    header: "Result",
    cell: ({ row: { original: challenge } }) => {
      const score = scores(challenge);
      if (!challenge.result) return <span className="text-xs text-mist-500">—</span>;
      const [first, second] = sides(challenge);
      const winner = challenge.result.winnerId === "draw" ? "Draw" : challenge.result.winnerId === first.id ? first.name : second.name;
      return (
        <span className="flex min-w-0 items-baseline gap-2">
          {score && <span className="font-mono text-sm font-semibold tabular-nums text-mist-50">{score[0]}–{score[1]}</span>}
          <span className="truncate text-xs text-mist-400">{winner}</span>
        </span>
      );
    },
  }),
];

const resultColumn = createColumnHelper<OrganiserResult>();
const resultColumns = [
  resultColumn.display({
    id: "event",
    header: "Event",
    cell: ({ row: { original: result } }) => (
      <span className="block min-w-0">
        <span className="block truncate font-medium text-mist-50">{result.eventName}</span>
        <span className="block truncate text-xs text-mist-400">{result.game.name}</span>
      </span>
    ),
  }),
  resultColumn.display({
    id: "players",
    header: "Result",
    cell: ({ row: { original: result } }) => (
      <span className="grid min-w-0 gap-1 text-sm">
        {[result.player1, result.player2].map((player, index) => {
          const won = result.winner === (index === 0 ? "player1" : "player2");
          const inner = (
            <>
              <Avatar src={player.profileImage ?? undefined} name={player.username} size="xs" />
              <span className={cn("truncate", won ? "font-semibold text-mist-50" : "text-mist-300")}>{player.username}</span>
              <span className={cn("ml-auto font-mono tabular-nums", won ? "text-mist-50" : "text-mist-400")}>{player.score ?? "–"}</span>
            </>
          );
          return player.id ? (
            <Link key={index} to={`/users/${player.id}`} className="flex max-w-64 items-center gap-2 hover:text-lavender-200">
              {inner}
            </Link>
          ) : (
            <span key={index} className="flex max-w-64 items-center gap-2">
              {inner}
            </span>
          );
        })}
      </span>
    ),
  }),
  resultColumn.display({
    id: "played",
    header: "Played",
    cell: ({ row }) => <span className="whitespace-nowrap font-mono text-xs text-mist-300">{formatDate(row.original.playedAt)}</span>,
  }),
  resultColumn.display({
    id: "recorded",
    header: "Recorded",
    cell: ({ row: { original: result } }) => (
      <span className="block text-xs text-mist-400">
        <span className="block text-mist-200">{result.recordedBy ?? "An admin"}</span>
        <span className="font-mono">{formatDate(result.recordedAt)}</span>
      </span>
    ),
  }),
];

export function ChallengesPage() {
  useDocumentTitle("Challenges");
  const client = useQueryClient();
  const [state, set] = useQueryState(DEFAULTS);
  const [recording, setRecording] = useState(false);
  const view = state.view === "results" ? "results" : "challenges";
  const page = Math.max(1, Number(state.page) || 1);
  const query: ChallengeQuery = {
    page,
    limit: LIMIT,
    search: state.search || undefined,
    status: (state.status || undefined) as ChallengeStatus | undefined,
    type: (state.type || undefined) as ChallengeQuery["type"],
    reported: state.reported === "true" ? "true" : undefined,
  };
  const summary = useQuery({ queryKey: [...root, "summary"], queryFn: getChallengeSummary, staleTime: 60_000 }).data;
  const challenges = useQuery({ queryKey: [...root, "list", query], queryFn: () => listChallenges(query), placeholderData: keepPreviousData, enabled: view === "challenges" });
  const resultsQuery = { page, limit: LIMIT, search: state.search || undefined };
  const results = useQuery({
    queryKey: [...root, "organiser", resultsQuery],
    queryFn: () => listOrganiserResults(resultsQuery),
    placeholderData: keepPreviousData,
    enabled: view === "results",
  });
  const segment = state.reported === "true" ? "reported" : state.status || null;
  const list = view === "results" ? results : challenges;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PageHeader
        title="Challenges"
        description="Matches players set up between themselves, and results from events Gamerie didn't run."
        refresh={[root]}
        actions={
          <>
            <Button tone="outline" size="sm" icon="trophy" onClick={() => setRecording(true)}>
              Record a result
            </Button>
            <LinkButton to="/challenges/new" size="sm" icon="plus">
              New challenge
            </LinkButton>
          </>
        }
      />
      <Segmented
        label="View"
        className="w-fit"
        value={view}
        onChange={(next) => set({ view: next === "results" ? "results" : "", search: "", status: "", type: "", reported: "" })}
        options={[
          { value: "challenges", label: summary ? `Challenges · ${summary.total}` : "Challenges" },
          { value: "results", label: summary ? `Organiser results · ${summary.organiserResults}` : "Organiser results" },
        ]}
      />
      {view === "challenges" && (
        <SegmentStrip
          loading={!summary}
          active={segment}
          onPick={(key) => set({ status: key && key !== "all" && key !== "reported" ? key : "", reported: key === "reported" ? "true" : "" })}
          segments={[
            { key: "all", label: "All", value: summary?.total, hint: "Player challenges" },
            { key: "pending", label: "Waiting", value: summary?.pending, hint: "Not answered yet" },
            { key: "accepted", label: "Ready", value: summary?.accepted, tone: "signal", hint: "Accepted, not played" },
            { key: "completed", label: "Played", value: summary?.completed, hint: "Result recorded" },
            { key: "reported", label: "Reported", value: summary?.reported, tone: "danger", hint: "Flagged by players" },
          ]}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <SearchField
          value={state.search}
          onChange={(search) => set({ search })}
          placeholder={view === "results" ? "Search players, games or events" : "Search players, teams or games"}
          className="w-full sm:w-80"
        />
        {view === "challenges" && (
          <>
            <FilterMenu label="Status" value={state.status} onChange={(status) => set({ status, reported: "" })} options={STATUS_ORDER.map((status) => ({ value: status, label: STATUS[status].label }))} />
            <FilterMenu label="Between" value={state.type} onChange={(type) => set({ type })} options={[{ value: "user", label: "Players" }, { value: "team", label: "Teams" }]} />
          </>
        )}
      </div>
      {view === "challenges" ? (
        <DataTable
          columns={columns}
          data={challenges.data?.data ?? []}
          getRowId={(challenge) => challenge.id}
          rowHref={(challenge) => `/challenges/${challenge.id}`}
          loading={challenges.isFetching}
          error={challenges.isError ? getApiErrorMessage(challenges.error, "Challenges didn't load.") : null}
          onRetry={() => void challenges.refetch()}
          minWidth="52rem"
          empty={{ icon: "challenges", title: "No challenges match", description: "Try another search or clear a filter." }}
        />
      ) : (
        <DataTable
          columns={resultColumns}
          data={results.data?.data ?? []}
          getRowId={(result) => result.id}
          loading={results.isFetching}
          error={results.isError ? getApiErrorMessage(results.error, "Organiser results didn't load.") : null}
          onRetry={() => void results.refetch()}
          minWidth="48rem"
          empty={{
            icon: "trophy",
            title: state.search ? "No results match" : "No organiser results yet",
            description: state.search ? "Try another search." : "Results you record from outside events show up here.",
          }}
        />
      )}
      {list.data && list.data.total > LIMIT && <TableFooter page={page} limit={LIMIT} total={list.data.total} onPage={(next) => set({ page: String(next) })} />}
      {recording && (
        <OrganiserResultDialog
          onClose={() => setRecording(false)}
          onRecorded={() => {
            toast.success("Result recorded");
            void client.invalidateQueries({ queryKey: root });
            set({ view: "results", search: "", status: "", type: "", reported: "" });
          }}
        />
      )}
    </div>
  );
}
