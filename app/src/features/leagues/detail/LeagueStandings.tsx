import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { EntrantLink } from "@/components/ui/EntrantLink";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { cn } from "@/lib/cn";
import { entrantPath } from "@/lib/paths";
import { LeagueLoadError } from "../components/LeagueBits";
import { useLeaguePlayoffs, useLeagueStandings } from "../hooks";
import type { LeagueBracketMatch, LeagueDetail, LeagueSeason, LeagueStandingRow } from "../types";
import { LEAGUE_TIEBREAKER_LABELS, formatMatchTime, leaguePlayoffLabel } from "../utils";

function Table({ rows, meId, team, finished }: { rows: LeagueStandingRow[]; meId: string | null; team: boolean; finished: boolean }) {
  return (
    <div className="relative overflow-x-auto rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
      <table className="w-full min-w-140 text-sm">
        <thead>
          <tr className="type-label text-left text-mist-500">
            <th scope="col" className="px-5 py-4 font-medium">
              #
            </th>
            <th scope="col" className="w-full px-2 py-4 font-medium">
              {team ? "Team" : "Player"}
            </th>
            {[
              ["P", "Played"],
              ["W", "Won"],
              ["D", "Drawn"],
              ["L", "Lost"],
              ["GD", "Game difference"],
              ["Pts", "Points"],
            ].map(([label, title]) => (
              <th key={label} scope="col" title={title} className="px-3 py-4 text-right font-medium last:pr-5">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const mine = row.id === meId;
            const place = finished && row.finalPlace ? row.finalPlace : row.rank;
            return (
              <tr key={row.id} className={cn("border-t border-white/6", mine && "bg-lavender-400/6")}>
                <td className={cn("px-5 py-3 font-semibold tabular-nums", place === 1 ? "text-signal" : row.playoffSeat ? "text-lavender-300" : "text-mist-400")}>
                  {finished && place === 1 ? <Icon name="crown" weight="fill" className="size-4" /> : finished ? place : `${place}${row.tied ? "=" : ""}`}
                </td>
                <th scope="row" className="px-2 py-3 text-left font-normal">
                  <span className="flex items-center gap-2.5">
                    <EntrantLink to={entrantPath(row)} className="flex min-w-0 items-center gap-2.5">
                      <Avatar src={row.avatar ?? undefined} name={row.displayName} size="sm" tone={team ? "ink" : "brand"} className="shrink-0 rounded-full" />
                      <span className="truncate font-semibold">{row.displayName}</span>
                    </EntrantLink>
                    <span className="flex min-w-0 items-center gap-2">
                      {mine && <span className="type-label shrink-0 text-lavender-300">You</span>}
                      {row.playoffSeat && !finished && (
                        <span title="In a playoff spot" className="type-label shrink-0 rounded-full bg-lavender-400/12 px-2 py-0.5 text-lavender-200 ring-1 ring-inset ring-lavender-400/30">
                          Playoffs
                        </span>
                      )}
                    </span>
                  </span>
                </th>
                {[row.played, row.won, row.drawn, row.lost].map((value, index) => (
                  <td key={index} className="px-3 py-3 text-right tabular-nums text-mist-300">
                    {value}
                  </td>
                ))}
                <td className="px-3 py-3 text-right tabular-nums text-mist-300">{row.gameDifference > 0 ? `+${row.gameDifference}` : row.gameDifference}</td>
                <td className="px-3 py-3 pr-5 text-right font-semibold tabular-nums">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LeagueStandings({ league, season }: { league: LeagueDetail; season: LeagueSeason }) {
  const query = useLeagueStandings(league.id, season.id);
  const [group, setGroup] = useState("all");
  const meId = league.viewer.entry?.id ?? null;
  const team = league.entrantType === "team";
  const finished = season.status === "completed";

  if (query.isLoading) return <Skeleton className="h-96 rounded-card" />;
  if (query.isError) return <LeagueLoadError what="table" error={query.error} onRetry={() => void query.refetch()} />;
  const data = query.data;
  if (!data?.rows.length)
    return <StatePanel icon="standings" title="The table is empty" description="It fills in as entries come in. Results update it straight away." />;

  const groupName = (id: string | null) => data.groups.find((item) => item.id === id)?.name ?? "Ungrouped";
  const grouped = data.groups.length > 1;
  const shown = grouped && group !== "all" ? data.groups.filter((item) => item.id === group) : data.groups;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      {grouped && data.perGroup && (
        <Segmented label="Group" value={group} onChange={setGroup} options={[{ value: "all", label: "All" }, ...data.groups.map((item) => ({ value: item.id, label: item.name }))]} className="w-fit" />
      )}
      {grouped && data.perGroup ? (
        shown.map((item) => (
          <section key={item.id} className="grid gap-2.5">
            <h3 className="text-sm font-semibold text-mist-200">{item.name}</h3>
            <Table rows={data.rows.filter((row) => row.groupId === item.id)} meId={meId} team={team} finished={finished} />
          </section>
        ))
      ) : (
        <Table rows={data.rows} meId={meId} team={team} finished={finished} />
      )}
      {data.groupTotals && (
        <section className="grid gap-2.5">
          <h3 className="text-sm font-semibold text-mist-200">Group standings</h3>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {data.groupTotals.map((total, index) => (
              <li key={total.groupId ?? index} className="flex items-center justify-between rounded-2xl bg-white/3 px-4 py-3 ring-1 ring-inset ring-white/6">
                <span className="text-sm font-semibold">{groupName(total.groupId)}</span>
                <span className="text-sm tabular-nums text-mist-300">
                  <span className="font-semibold text-mist-50">{total.points}</span> pts · {total.played} played
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
      <p className="text-xs leading-relaxed text-mist-500">
        Win {season.points.win} · {season.allowDraws ? `draw ${season.points.draw} · ` : ""}loss {season.points.loss}. Ties broken by {season.tiebreakers.map((item) => LEAGUE_TIEBREAKER_LABELS[item].toLowerCase()).join(", then ")}.
        {season.playoffs ? ` ${leaguePlayoffLabel(season.playoffs)} after the regular season.` : ""}
      </p>
    </div>
  );
}

const laneTitle: Record<LeagueBracketMatch["lane"], string> = {
  upper: "Upper bracket",
  lower: "Lower bracket",
  grand_final: "Grand final",
  third_place: "Third place",
  group: "Group",
};

function roundName(match: LeagueBracketMatch, rounds: number) {
  if (match.lane !== "upper") return `Round ${match.round}`;
  const left = rounds - match.round;
  return left === 0 ? "Final" : left === 1 ? "Semifinals" : left === 2 ? "Quarterfinals" : `Round ${match.round}`;
}

export function LeaguePlayoffs({ league, season }: { league: LeagueDetail; season: LeagueSeason }) {
  const query = useLeaguePlayoffs(league.id, season.id, Boolean(season.playoffs));
  const meId = league.viewer.entry?.id ?? null;
  if (!season.playoffs) return <StatePanel icon="bracket" title="No playoffs this season" description="The regular season table decides the champion." />;
  if (query.isLoading) return <Skeleton className="h-96 rounded-card" />;
  if (query.isError) return <LeagueLoadError what="bracket" error={query.error} onRetry={() => void query.refetch()} />;
  const matches = query.data?.matches;
  if (!matches?.length)
    return (
      <StatePanel
        icon="bracket"
        title="The bracket is set when the regular season ends"
        description={`${leaguePlayoffLabel(season.playoffs)}. The top of the table goes through, seeded by final position.`}
      />
    );

  const lanes = (["upper", "lower", "grand_final", "third_place"] as const).filter((lane) => matches.some((match) => match.lane === lane));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {lanes.map((lane) => {
        const laneMatches = matches.filter((match) => match.lane === lane);
        const rounds = [...new Set(laneMatches.map((match) => match.round))].sort((a, b) => a - b);
        const last = rounds[rounds.length - 1] ?? 1;
        return (
          <section key={lane} className="grid gap-3">
            {lanes.length > 1 && <h3 className="text-sm font-semibold text-mist-200">{laneTitle[lane]}</h3>}
            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
              {rounds.map((round) => (
                <div key={round} className="grid w-64 shrink-0 content-start gap-3">
                  <p className="type-label text-mist-500">{roundName(laneMatches.find((match) => match.round === round)!, last)}</p>
                  {laneMatches
                    .filter((match) => match.round === round)
                    .sort((a, b) => a.position - b.position)
                    .map((match) => (
                      <div key={match.key} className="overflow-hidden rounded-2xl bg-ink-900/60 ring-1 ring-inset ring-white/8">
                        {match.sides.map((slot, index) => {
                          const won = Boolean(slot.participantId && slot.participantId === match.winnerParticipantId);
                          const mine = Boolean(slot.participantId && slot.participantId === meId);
                          return (
                            <div key={index} className={cn("flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm", index > 0 && "border-t border-white/6", mine && "bg-lavender-400/8")}>
                              <EntrantLink
                                to={slot.participantId ? entrantPath(slot) : null}
                                className={cn("min-w-0 truncate", won ? "font-semibold text-mist-50" : slot.name ? "text-mist-200" : "text-mist-500")}
                              >
                                {slot.name ?? (slot.state === "bye" ? "Bye" : "To be decided")}
                              </EntrantLink>
                              {won && <Icon name="check" weight="bold" className="size-3.5 shrink-0 text-signal" />}
                            </div>
                          );
                        })}
                        <p className="border-t border-white/6 px-3.5 py-1.5 text-xs text-mist-500">{match.fixtureStatus === "void" ? "Not played" : match.fixtureStatus === "forfeit" ? "Forfeit" : (match.score ?? (match.matchAt ? formatMatchTime(match.matchAt) : "Waiting for earlier rounds"))}</p>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
