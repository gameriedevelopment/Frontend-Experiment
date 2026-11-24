import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { StatePanel } from "@/components/ui/StatePanel";
import { Panel } from "@/components/layout/Panel";
import { ActivityFeed } from "@/components/record/ActivityFeed";
import { BackLink } from "@/components/record/BackLink";
import { DossierHeader, DossierSkeleton } from "@/components/record/DossierHeader";
import { Facts, Figures } from "@/components/record/Facts";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Stamp } from "@/components/record/Stamp";
import { useBreadcrumb } from "@/app/shell/crumb";
import { EntrantList } from "@/features/competitions/components/EntrantList";
import { MatchTable } from "@/features/competitions/components/MatchTable";
import { StatusStamp } from "@/features/competitions/components/StatusStamp";
import { money } from "@/features/competitions/format";
import type { MatchRow } from "@/features/competitions/types";
import { OwnerCell } from "@/features/people/components/OwnerCell";
import { playerAppLink } from "@/lib/env";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime, statusLabel } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useLadder, useLadderActions, useLadderEntrants, useLadderMatches } from "./hooks";
import type { LadderMatch, LadderMatchFilter } from "./types";

const FILTERS: Array<{ value: LadderMatchFilter; label: string }> = [
  { value: "disputed", label: "Disputed" },
  { value: "open", label: "Open" },
  { value: "final", label: "Final" },
  { value: "cancelled", label: "Cancelled" },
];

const toRow = (match: LadderMatch): MatchRow => {
  const winner = match.result?.winnerParticipantId;
  return {
    id: match.id,
    sideA: { id: match.challenger.participantId, name: match.challenger.name },
    sideB: { id: match.challenged.participantId, name: match.challenged.name },
    scoreA: match.result?.challengerScore ?? null,
    scoreB: match.result?.challengedScore ?? null,
    winner: !match.result ? null : winner === match.challenger.participantId ? "a" : winner === match.challenged.participantId ? "b" : "draw",
    status: match.status,
    when: match.finalAt ?? match.scheduledAt,
    label: null,
  };
};

export function LadderPage() {
  const { ladderId = "" } = useParams();
  const ladder = useLadder(ladderId);
  const entrants = useLadderEntrants(ladderId);
  const [filter, setFilter] = useState<LadderMatchFilter>("disputed");
  const matches = useLadderMatches(ladderId, filter);
  const actions = useLadderActions(ladderId);
  const [removing, setRemoving] = useState(false);
  const data = ladder.data;
  useBreadcrumb(data?.name);
  useDocumentTitle(data?.name ?? "Ladder");

  if (ladder.isLoading) return <DossierSkeleton />;
  if (!data) {
    return (
      <div className="grid gap-6">
        <BackLink to="/ladders" label="Ladders" />
        <StatePanel icon="ladders" tone="danger" title="This ladder didn't load" description={getApiErrorMessage(ladder.error, "It may have been deleted.")} />
      </div>
    );
  }

  const standings = [...(entrants.data?.participants ?? [])].sort((a, b) => b.points - a.points || b.played - a.played);
  const groupName = new Map((entrants.data?.groups ?? []).map((group) => [group.id, group.name]));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <DossierHeader
        title={data.name}
        image={data.host.logo}
        cover={data.banner}
        square
        stamps={
          <>
            <StatusStamp status={data.status} removed={Boolean(data.removed)} />
            {data.official && <Stamp tone="lavender" icon="seal">Official</Stamp>}
            {data.matches.disputed > 0 && <Stamp tone="danger" icon="scales">{data.matches.disputed} disputed</Stamp>}
          </>
        }
        meta={
          <>
            <span>{data.game.name}</span>
            <span>{[data.platform, data.region].filter(Boolean).join(" · ")}</span>
            <span>
              {formatDate(data.startsAt)} → {formatDate(data.endsAt)}
            </span>
            <span>Hosted by {data.official ? "Gamerie" : data.host.name}</span>
          </>
        }
        actions={
          <>
            <ButtonLink href={playerAppLink(`/ladders/${data.id}`)} external tone="outline" size="sm" icon="open">
              Open in Gamerie
            </ButtonLink>
            {data.removed ? (
              <Button
                tone="outline"
                size="sm"
                icon="refresh"
                onClick={() =>
                  void actions
                    .restore()
                    .then(() => toast.success("Ladder restored"))
                    .catch((error) => toast.error("Couldn't restore it", getApiErrorMessage(error, "Try again in a moment.")))
                }
              >
                Restore
              </Button>
            ) : (
              <Button tone="ghost" size="sm" icon="eyeSlash" className="text-mist-400 hover:text-danger" onClick={() => setRemoving(true)}>
                Remove
              </Button>
            )}
          </>
        }
      />
      {data.removed && (
        <div className="rounded-2xl bg-danger/6 px-5 py-4 text-sm text-mist-200 ring-1 ring-inset ring-danger/25">
          Removed {formatDateTime(data.removed.at)}. {data.removed.reason ? `Reason: ${data.removed.reason}` : ""}
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-6">
          <Figures
            items={[
              { label: "Entrants", value: `${data.participantCount}${data.maxParticipants ? ` / ${data.maxParticipants}` : ""}`, hint: data.entrantType === "team" ? "Teams" : "Players" },
              { label: "Played", value: data.matches.completed },
              { label: "Open", value: data.matches.open, hint: "Accepted or waiting" },
              { label: "Disputed", value: data.matches.disputed, hint: data.matches.disputed ? "Waiting on Gamerie" : "None" },
            ]}
          />
          <Panel title="Matches" actions={<Segmented label="Matches" value={filter} onChange={setFilter} options={FILTERS} />}>
            <MatchTable
              rows={(matches.data?.data ?? []).map(toRow)}
              loading={matches.isLoading}
              empty={filter === "disputed" ? "No disputed matches." : `No ${filter} matches.`}
              actions={{
                canAct: (match) => ({
                  correct: ["completed", "disputed", "in_report_window"].includes(match.status),
                  cancel: !["cancelled", "rejected", "expired"].includes(match.status),
                }),
                correct: (match, a, b, reason) => {
                  if (a === b && !data.allowDraws) return Promise.reject(new Error("This ladder doesn't allow draws. Enter a winner."));
                  return actions
                    .correct(match.id, {
                      ...(a === b ? { outcome: "draw" as const } : { winnerParticipantId: a > b ? match.sideA.id : match.sideB.id }),
                      challengerScore: a,
                      challengedScore: b,
                      reason,
                    })
                    .then(() => toast.success("Result corrected", "The table has been recalculated."));
                },
                cancel: (match, reason) => actions.cancel(match.id, reason).then(() => toast.info("Match cancelled")),
              }}
            />
          </Panel>
          <Panel title="Standings">
            <EntrantList
              empty="Nobody has joined yet."
              rows={standings.map((entrant, index) => ({
                id: entrant.id,
                name: entrant.name,
                avatar: entrant.avatar,
                kind: entrant.kind,
                targetId: null,
                status: entrant.status,
                position: index + 1,
                positionKind: "rank",
                detail: [`${entrant.points} pts`, `${entrant.played} played`, entrant.groupId ? groupName.get(entrant.groupId) : null, entrant.rematchLocks ? `${entrant.rematchLocks} rematch locks` : null]
                  .filter(Boolean)
                  .join(" · "),
              }))}
            />
          </Panel>
          <ActivityFeed entries={data.activity} />
        </div>
        <aside className="grid min-w-0 gap-6">
          {data.organizer && !data.official && (
            <Panel title="Organizer">
              <OwnerCell owner={{ id: data.organizer.id, username: data.organizer.username, profileImage: data.organizer.avatar }} />
              <p className="mt-2 font-mono text-xs text-mist-500">{data.organizer.email}</p>
            </Panel>
          )}
          <Panel title="Setup">
            <Facts
              items={[
                ["Entry", statusLabel(data.joinMode)],
                ["Points (W/D/L)", `${data.points.win} / ${data.points.draw} / ${data.points.loss}`],
                ["Draws", data.allowDraws ? "Allowed" : "Not allowed"],
                ["Best of", data.bestOf],
                ["Groups", data.groups.count > 1 ? data.groups.count : "One table"],
                ["Team size", data.entrantType === "team" ? data.teamSize : null],
                ["Prize", money(data.prize) ?? "None"],
              ]}
            />
          </Panel>
          {data.description && (
            <Panel title="About">
              <p className="whitespace-pre-line text-sm leading-relaxed text-mist-300">{data.description}</p>
            </Panel>
          )}
        </aside>
      </div>
      {removing && (
        <ReasonDialog
          title={`Remove ${data.name}?`}
          description="It disappears from Gamerie for everyone except its organizer, who is told why. You can restore it later."
          confirmLabel="Remove"
          icon="eyeSlash"
          onClose={() => setRemoving(false)}
          onConfirm={(reason) => actions.remove(reason).then(() => toast.info("Ladder removed"))}
        />
      )}
    </div>
  );
}
