import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tag } from "@/components/ui/Tag";
import { formatChallengeDateTime } from "@/features/challenges/lifecycle";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useLadderAction, useLadderMatches } from "../hooks";
import type { LadderChallenge, LadderDetail } from "../types";
import { formatLadderDate } from "../utils";

type Filter = "mine" | "all";
type Perspective = { incoming: boolean; involved: boolean; opposingReview: boolean };

function perspectiveOf(match: LadderChallenge, meId: string | undefined): Perspective {
  const involved = Boolean(meId) && [match.ladderChallengerParticipantId, match.ladderChallengedParticipantId].includes(meId!);
  return {
    involved,
    incoming: meId === match.ladderChallengedParticipantId,
    opposingReview:
      involved &&
      match.status === "in_report_window" &&
      ((match.declaredSide === "a" && meId === match.ladderChallengedParticipantId) || (match.declaredSide === "b" && meId === match.ladderChallengerParticipantId)),
  };
}

function statusOf(match: LadderChallenge, view: Perspective): { label: string; tone: "lavender" | "muted" | "signal"; danger?: boolean; actionable: boolean } {
  switch (match.status) {
    case "pending":
      return view.incoming ? { label: "Your answer", tone: "lavender", actionable: true } : { label: "Awaiting answer", tone: "muted", actionable: false };
    case "accepted":
      return { label: "To play", tone: view.involved ? "lavender" : "muted", actionable: view.involved };
    case "in_report_window":
      return view.opposingReview ? { label: "Confirm result", tone: "lavender", actionable: true } : { label: "Result reported", tone: "muted", actionable: false };
    case "completed":
      return { label: "Final", tone: "signal", actionable: false };
    case "disputed":
      return { label: "Disputed", tone: "muted", danger: true, actionable: false };
    default:
      return { label: match.status.charAt(0).toUpperCase() + match.status.slice(1).replace(/_/g, " "), tone: "muted", actionable: false };
  }
}

function Side({ name, outcome, mine, align }: { name: string; outcome: "won" | "lost" | null; mine: boolean; align: "start" | "end" }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", align === "end" && "flex-row-reverse text-right")}>
      <Avatar name={name} size="sm" className="rounded-full" />
      <span className="min-w-0">
        <span className={cn("block truncate text-sm font-semibold", outcome === "lost" && "text-mist-400", mine && outcome !== "lost" && "text-lavender-200")}>{name}</span>
        {outcome === "won" ? (
          <span className={cn("type-label mt-0.5 flex items-center gap-1 text-signal", align === "end" && "justify-end")}>
            <Icon name="trophy" weight="fill" className="size-3" />
            Won
          </span>
        ) : mine ? (
          <span className="type-label mt-0.5 block text-mist-500">You</span>
        ) : null}
      </span>
    </span>
  );
}

function deadlineOf(match: LadderChallenge) {
  if (match.status === "pending" && match.answerDeadlineAt) return `Answer by ${formatLadderDate(match.answerDeadlineAt)}`;
  if (match.status === "accepted" && match.playDeadlineAt) return `Play by ${formatLadderDate(match.playDeadlineAt)}`;
  if (match.status === "in_report_window" && match.reportWindowEndsAt) return `Locks ${formatChallengeDateTime(match.reportWindowEndsAt)}`;
  return null;
}

export function LadderMatches({ ladder, onReport }: { ladder: LadderDetail; onReport: (match: LadderChallenge) => void }) {
  const query = useLadderMatches(ladder.id, ladder.status === "in_progress");
  const actions = useLadderAction(ladder.id);
  const me = ladder.viewer.participant;
  const matches = query.data?.data ?? [];
  const [filter, setFilter] = useState<Filter>(me ? "mine" : "all");
  const shown = filter === "mine" && me ? matches.filter((match) => [match.ladderChallengerParticipantId, match.ladderChallengedParticipantId].includes(me.id)) : matches;
  const busy = actions.respond.isPending || actions.reviewResult.isPending;
  const fail = (title: string) => (error: unknown) => toast.error(title, getApiErrorMessage(error, "Try again in a moment."));

  if (query.isLoading)
    return (
      <div aria-hidden="true" className="grid gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {me && (
        <Segmented
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "mine", label: "Mine" },
            { value: "all", label: "All" },
          ]}
          className="w-fit"
        />
      )}
      {shown.length ? (
        <ul className="grid grid-cols-[minmax(0,1fr)] gap-2">
          {shown.map((match) => {
            const view = perspectiveOf(match, me?.id);
            const status = statusOf(match, view);
            const a = match.challengerTeamName ?? match.challengerName ?? "Challenger";
            const b = match.challengedTeamName ?? match.challengedName ?? "Opponent";
            const winner = match.result?.winnerId;
            const decided = Boolean(winner) && winner !== "draw";
            const outcomeA = decided ? (winner === match.ladderChallengerParticipantId ? "won" : "lost") : null;
            const outcomeB = decided ? (winner === match.ladderChallengedParticipantId ? "won" : "lost") : null;
            const deadline = deadlineOf(match);
            return (
              <li
                key={match.id}
                className={cn(
                  "rounded-2xl bg-ink-900/60 p-4 ring-1 ring-inset transition-colors sm:px-5",
                  status.actionable ? "bg-lavender-400/4 ring-lavender-400/35" : "ring-white/6",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                  <div className="grid min-w-0 max-w-lg flex-1 basis-80 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-5">
                    <Side name={a} outcome={outcomeA} mine={me?.id === match.ladderChallengerParticipantId} align="end" />
                    {match.result ? (
                      <span className="type-display min-w-14 text-center text-xl tabular-nums">
                        {match.result.p1Score ?? match.result.score.split("-")[0]}
                        <span className="mx-1 text-mist-500">–</span>
                        {match.result.p2Score ?? match.result.score.split("-")[1]}
                      </span>
                    ) : (
                      <span className="min-w-14 text-center font-serif text-lg italic text-mist-500">vs</span>
                    )}
                    <Side name={b} outcome={outcomeB} mine={me?.id === match.ladderChallengedParticipantId} align="start" />
                  </div>
                  {status.actionable && (
                    <div className="flex w-full gap-2 sm:w-auto *:flex-1 sm:*:flex-none">
                      {view.incoming && match.status === "pending" && (
                        <>
                          <Button
                            tone="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => actions.respond.mutate({ challengeId: match.id, action: "reject" }, { onSuccess: () => toast.info("Challenge declined"), onError: fail("Couldn't decline") })}
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => actions.respond.mutate({ challengeId: match.id, action: "accept" }, { onSuccess: () => toast.success("Challenge accepted", "Play before the deadline."), onError: fail("Couldn't accept") })}
                          >
                            Accept
                          </Button>
                        </>
                      )}
                      {view.involved && match.status === "accepted" && (
                        <Button size="sm" icon="trophy" onClick={() => onReport(match)}>
                          Report result
                        </Button>
                      )}
                      {view.opposingReview && (
                        <>
                          <Button
                            tone="ghost"
                            size="sm"
                            icon="flag"
                            disabled={busy}
                            onClick={() => actions.reviewResult.mutate({ challengeId: match.id, action: "dispute" }, { onSuccess: () => toast.info("Result disputed", "The organizer reviews it."), onError: fail("Couldn't dispute") })}
                          >
                            Dispute
                          </Button>
                          <Button
                            size="sm"
                            icon="check"
                            disabled={busy}
                            onClick={() => actions.reviewResult.mutate({ challengeId: match.id, action: "accept" }, { onSuccess: () => toast.success("Result confirmed", "The table is updated."), onError: fail("Couldn't confirm") })}
                          >
                            Confirm
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/5 pt-3 text-xs text-mist-500">
                  <Tag tone={status.tone} className={cn(status.danger && "bg-danger/12 text-danger")}>
                    {status.label}
                  </Tag>
                  <span>{formatChallengeDateTime(match.scheduledDate)}</span>
                  {deadline && <span className={cn(status.actionable && "text-lavender-200")}>{deadline}</span>}
                  {winner === "draw" && <span>Draw</span>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <StatePanel
          icon="challenges"
          title={filter === "mine" ? "No matches for you yet" : "No matches yet"}
          description={filter === "mine" ? "Challenge someone from the standings. Their answer and your deadlines show up here." : "Challenges sent on this ladder show up here, with their deadlines."}
        />
      )}
    </div>
  );
}
