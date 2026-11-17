import { AnimatePresence, m } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { acceptResult, markReady, respondToProposal } from "../api";
import { EntrantMark } from "../components/EntrantMark";
import { useNow, useTournamentAction, useTournamentBracket } from "../hooks";
import type { BracketEntrant, BracketMatch, HostedTournamentDetail } from "../types";
import { durationLabel, formatShortDateTime, untilLabel } from "../utils";
import { DeclareScoreDialog, ReportMatchDialog, TimeDialog } from "./MatchDialogs";
import { READY_WINDOW_MS, matchStage } from "./viewer";

type Filter = "all" | "mine" | "live" | "open" | "done";
const filters: Array<{ value: Filter; label: string }> = [
  { value: "mine", label: "Mine" },
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "open", label: "Upcoming" },
  { value: "done", label: "Finished" },
];
const OPEN = ["ready", "scheduled", "live", "result_pending", "disputed"];

type DialogState =
  | { kind: "declare"; match: BracketMatch }
  | { kind: "time"; match: BracketMatch; mode: "propose" | "counter" | "organizer" }
  | { kind: "report"; match: BracketMatch }
  | null;

function statusText(match: BracketMatch, now: number): string {
  switch (match.status) {
    case "pending":
      return "Waiting for opponents";
    case "ready":
      return match.timeProposal
        ? `Time proposed for ${formatShortDateTime(match.timeProposal.scheduledAt)}`
        : match.deadlineAt
          ? `Agree a time · play by ${formatShortDateTime(match.deadlineAt)}`
          : match.opensAt && new Date(match.opensAt).getTime() > now
            ? `Opens ${formatShortDateTime(match.opensAt)}`
            : "Ready";
    case "scheduled":
      return `${formatShortDateTime(match.scheduledAt)} · ${untilLabel(match.scheduledAt, now) ?? ""}`;
    case "live":
      return "Live now";
    case "result_pending":
      return match.challenge?.reportWindowEndsAt
        ? `Final in ${durationLabel(new Date(match.challenge.reportWindowEndsAt).getTime() - now)}`
        : "Result pending";
    case "disputed":
      return "Reported · an admin is deciding";
    case "completed":
      return match.forfeitedBy ? "Final · forfeit" : match.resolution === "admin" ? "Final · decided by Gamerie" : "Final";
    case "bye":
      return "Bye";
    default:
      return "Not played";
  }
}

function Note({ icon, tone = "neutral", children }: { icon: IconName; tone?: "neutral" | "danger"; children: ReactNode }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ring-1 ring-inset",
        tone === "danger" ? "bg-danger/8 text-mist-200 ring-danger/25" : "bg-white/3 text-mist-300 ring-white/6",
      )}
    >
      <Icon name={icon} className={cn("mt-0.5 size-4 shrink-0", tone === "danger" ? "text-danger" : "text-lavender-300")} />
      <span>{children}</span>
    </p>
  );
}

function Side({ entrant, state, won, align }: { entrant?: BracketEntrant; state: string; won: boolean; align: "start" | "end" }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", align === "end" && "flex-row-reverse text-right")}>
      <EntrantMark name={entrant?.name ?? "?"} src={entrant?.avatar} size="sm" />
      <span className={cn("truncate text-sm", won ? "font-semibold text-mist-50" : "font-medium text-mist-300")}>
        {entrant?.name ?? (state === "empty" ? "Bye" : "To be decided")}
      </span>
    </span>
  );
}

export function MatchesTab({
  tournament,
  focusMatchId,
  focusRequest,
}: {
  tournament: HostedTournamentDetail;
  focusMatchId: string | null;
  focusRequest: number;
}) {
  const started = ["live", "paused", "completed", "cancelled"].includes(tournament.phase);
  const query = useTournamentBracket(tournament.id, started, tournament.phase === "live");
  const myEntrantId = tournament.viewer.entrant?.id;
  const canAct = Boolean(tournament.viewer.entrant?.canAct);
  const [filter, setFilter] = useState<Filter>(myEntrantId ? "mine" : "all");
  const [expanded, setExpanded] = useState<string | null>(focusMatchId);
  const [dialog, setDialog] = useState<DialogState>(null);
  const now = useNow();
  const focusRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!focusMatchId) return;
    setExpanded(focusMatchId);
    setFilter("all");
    requestAnimationFrame(() => focusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }, [focusMatchId, focusRequest, query.isSuccess]);

  const ready = useTournamentAction(tournament.id, (matchId: string) => markReady(tournament.id, matchId));
  const accept = useTournamentAction(tournament.id, (matchId: string) => acceptResult(tournament.id, matchId));
  const acceptTime = useTournamentAction(tournament.id, (matchId: string) =>
    respondToProposal(tournament.id, matchId, { action: "accept" }),
  );
  const mutationError = ready.error ?? accept.error ?? acceptTime.error;

  const entrants = useMemo(
    () => new Map<string, BracketEntrant>((query.data?.entrants ?? []).map((entrant) => [entrant.id, entrant])),
    [query.data?.entrants],
  );
  const matches = useMemo(() => {
    const all = (query.data?.matches ?? []).filter((match) => match.status !== "void");
    const mine = (match: BracketMatch) => match.sideA.entrantId === myEntrantId || match.sideB.entrantId === myEntrantId;
    return all.filter((match) => {
      if (filter === "mine") return Boolean(myEntrantId) && mine(match);
      if (filter === "live") return ["live", "result_pending", "disputed"].includes(match.status);
      if (filter === "open") return ["pending", "ready", "scheduled"].includes(match.status);
      if (filter === "done") return ["completed", "bye"].includes(match.status);
      return true;
    });
  }, [filter, myEntrantId, query.data?.matches]);

  if (!started) {
    return (
      <StatePanel
        icon="calendar"
        title="Matches appear when the bracket is drawn"
        description="Each of your matches also shows up in Challenges and on your calendar."
      />
    );
  }
  if (query.isLoading) return <Skeleton className="h-96 rounded-card" />;
  if (query.isError) {
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="Matches didn't load"
        description={getApiErrorMessage(query.error, "Try again in a moment.")}
        action={
          <Button tone="outline" size="sm" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const groups = new Map<string, BracketMatch[]>();
  for (const match of matches) groups.set(match.label, [...(groups.get(match.label) ?? []), match]);
  const success = (title: string) => ({ onSuccess: () => toast.success(title) });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Segmented
        label="Show matches"
        options={filters.filter((item) => item.value !== "mine" || myEntrantId)}
        value={filter}
        onChange={setFilter}
        className="relative w-fit max-w-full overflow-x-auto scrollbar-none"
      />
      {mutationError && (
        <p role="alert" className="text-sm text-danger">
          {getApiErrorMessage(mutationError, "That didn't go through.")}
        </p>
      )}

      {!matches.length ? (
        <StatePanel icon="matches" title="No matches here" description="Try another filter." />
      ) : (
        [...groups.entries()].map(([label, rows]) => (
          <section key={label} className="grid gap-3">
            <h3 className="type-label text-mist-500">{label}</h3>
            <ul className="grid gap-2">
              {rows.map((match) => {
                const a = match.sideA.entrantId ? entrants.get(match.sideA.entrantId) : undefined;
                const b = match.sideB.entrantId ? entrants.get(match.sideB.entrantId) : undefined;
                const mySide = match.sideA.entrantId === myEntrantId ? "a" : match.sideB.entrantId === myEntrantId ? "b" : null;
                const open = expanded === match.id;
                const challenge = match.challenge;
                const scheduled = match.scheduledAt ? new Date(match.scheduledAt).getTime() : null;
                const playing = Boolean(mySide && canAct && OPEN.includes(match.status) && tournament.phase === "live");
                const canReady =
                  playing &&
                  challenge?.status === "accepted" &&
                  scheduled !== null &&
                  now >= scheduled - READY_WINDOW_MS &&
                  !(mySide === "a" ? challenge.readyA : challenge.readyB);
                const canDeclare = playing && challenge?.status === "accepted" && scheduled !== null && now >= scheduled;
                const canAccept =
                  playing && match.status === "result_pending" && challenge?.declaredSide && challenge.declaredSide !== mySide;
                const canReport = Boolean(
                  mySide && challenge && ["result_pending", "completed"].includes(match.status) && challenge.declaredSide !== mySide,
                );
                const needsTime = playing && match.status === "ready" && !challenge && tournament.schedule?.roundMode === "deadline";
                const proposalFromOpponent =
                  needsTime && match.timeProposal && match.timeProposal.proposedByEntrantId !== myEntrantId;
                const stage = playing && mySide ? matchStage(match, mySide, tournament.schedule?.roundMode, now) : null;
                const organizerTime =
                  tournament.viewer.isOrganizer &&
                  ["ready", "scheduled"].includes(match.status) &&
                  !(challenge?.readyA && challenge?.readyB) &&
                  challenge?.status !== "in_report_window" &&
                  tournament.phase !== "completed";
                const scoreA = match.status === "completed" ? match.sideA.score : challenge?.provisional?.scoreA;
                const scoreB = match.status === "completed" ? match.sideB.score : challenge?.provisional?.scoreB;
                const live = match.status === "live";
                const actionable = Boolean(canReady || canDeclare || canAccept || proposalFromOpponent || (needsTime && !match.timeProposal));

                return (
                  <li
                    key={match.id}
                    ref={match.id === focusMatchId ? focusRef : undefined}
                    className={cn(
                      "relative overflow-hidden rounded-2xl bg-ink-900/60 ring-1 ring-inset transition-colors",
                      actionable ? "ring-lavender-400/40" : mySide ? "ring-lavender-400/20" : "ring-white/6",
                      open && "bg-ink-900",
                    )}
                  >
                    {mySide && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-lavender-400" />}
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setExpanded(open ? null : match.id)}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-3.5 text-left sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,13rem)_1.25rem] sm:gap-4"
                    >
                      <span className="type-label hidden text-mist-500 sm:block">#{match.number}</span>
                      <Side entrant={a} state={match.sideA.state} won={match.winnerEntrantId === a?.id && Boolean(a)} align="start" />
                      <span className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 font-semibold tabular-nums">
                        {live && <span className="size-1.5 animate-pulse rounded-full bg-signal motion-reduce:animate-none" />}
                        {scoreA ?? "–"}
                        <span className="text-mist-500">:</span>
                        {scoreB ?? "–"}
                      </span>
                      <Side entrant={b} state={match.sideB.state} won={match.winnerEntrantId === b?.id && Boolean(b)} align="end" />
                      <span
                        className={cn(
                          "col-span-3 truncate text-xs sm:col-span-1 sm:text-right sm:text-sm",
                          live ? "text-signal" : actionable ? "text-lavender-300" : "text-mist-500",
                        )}
                      >
                        {actionable && !live ? "Your move · " : ""}
                        {statusText(match, now)}
                      </span>
                      <Icon
                        name="chevronDown"
                        className={cn("hidden size-4 text-mist-500 transition-transform sm:block", open && "rotate-180")}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {open && (
                        <m.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: easeOutExpo }}
                          className="overflow-hidden"
                        >
                          <div className="grid gap-4 border-t border-white/6 px-4 py-4 sm:px-5">
                            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                              <div>
                                <dt className="type-label text-mist-500">Series</dt>
                                <dd className="mt-1.5 text-sm font-semibold">Best of {match.bestOf}</dd>
                              </div>
                              <div>
                                <dt className="type-label text-mist-500">{match.scheduledAt ? "Match time" : "Deadline"}</dt>
                                <dd className="mt-1.5 text-sm font-semibold">
                                  {formatShortDateTime(match.scheduledAt ?? match.deadlineAt)}
                                </dd>
                              </div>
                              {challenge && (
                                <div className="col-span-2">
                                  <dt className="type-label text-mist-500">Ready</dt>
                                  <dd className="mt-1.5 flex flex-wrap gap-2">
                                    {[
                                      [a?.name, challenge.readyA],
                                      [b?.name, challenge.readyB],
                                    ].map(([name, on], index) => (
                                      <span
                                        key={index}
                                        className={cn(
                                          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                                          on ? "bg-signal/12 text-signal ring-signal/30" : "text-mist-400 ring-white/10",
                                        )}
                                      >
                                        <Icon name={on ? "check" : "clock"} weight={on ? "bold" : "regular"} className="size-3" />
                                        {name ?? "Opponent"}
                                      </span>
                                    ))}
                                  </dd>
                                </div>
                              )}
                              {match.station && (
                                <div>
                                  <dt className="type-label text-mist-500">Station</dt>
                                  <dd className="mt-1.5 text-sm font-semibold">{match.station}</dd>
                                </div>
                              )}
                            </dl>

                            {match.timeProposal && (
                              <Note icon="clock">
                                {match.timeProposal.proposedByEntrantId === myEntrantId ? "You proposed" : "Proposed"}{" "}
                                {formatShortDateTime(match.timeProposal.scheduledAt)}
                                {match.timeProposal.note ? `, "${match.timeProposal.note}"` : ""}
                              </Note>
                            )}
                            {stage?.kind === "waiting" && (
                              <Note icon="hourglass">
                                The ready check opens {untilLabel(new Date(stage.readyOpensAt).toISOString(), now)}. Mark ready then; the
                                score can be declared once the match starts.
                              </Note>
                            )}
                            {stage?.kind === "ready" && (
                              <Note icon="check">
                                You're ready. Declaring the score opens at {formatShortDateTime(new Date(stage.startsAt).toISOString())}.
                              </Note>
                            )}
                            {stage?.kind === "awaiting_time" && (
                              <Note icon="clock">The organizer sets the time for this match. You'll be notified.</Note>
                            )}
                            {match.status === "result_pending" && challenge?.declaredSide === mySide && (
                              <Note icon="hourglass">
                                You declared the score. It's final when the report window ends or your opponent accepts it.
                              </Note>
                            )}
                            {match.status === "disputed" && (
                              <Note icon="flag" tone="danger">
                                Reported. Only this match waits while a Gamerie admin confirms, corrects or orders a replay.
                              </Note>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {canReady && (
                                <Button size="sm" icon="check" disabled={ready.isPending} onClick={() => ready.mutate(match.id, success("You're ready"))}>
                                  Mark ready
                                </Button>
                              )}
                              {canDeclare && (
                                <Button size="sm" icon="trophy" onClick={() => setDialog({ kind: "declare", match })}>
                                  Declare score
                                </Button>
                              )}
                              {canAccept && (
                                <Button
                                  size="sm"
                                  icon="check"
                                  disabled={accept.isPending}
                                  onClick={() => accept.mutate(match.id, success("Result accepted"))}
                                >
                                  Accept result
                                </Button>
                              )}
                              {proposalFromOpponent && (
                                <Button
                                  size="sm"
                                  icon="check"
                                  disabled={acceptTime.isPending}
                                  onClick={() => acceptTime.mutate(match.id, success("Match time locked in"))}
                                >
                                  Accept time
                                </Button>
                              )}
                              {needsTime && (
                                <Button
                                  size="sm"
                                  tone="outline"
                                  icon="clock"
                                  onClick={() => setDialog({ kind: "time", match, mode: proposalFromOpponent ? "counter" : "propose" })}
                                >
                                  {proposalFromOpponent ? "Suggest another time" : match.timeProposal ? "Change proposal" : "Propose a time"}
                                </Button>
                              )}
                              {organizerTime && (
                                <Button size="sm" tone="outline" icon="clock" onClick={() => setDialog({ kind: "time", match, mode: "organizer" })}>
                                  {match.scheduledAt ? "Change time" : "Set time"}
                                </Button>
                              )}
                              {canReport && (
                                <Button size="sm" tone="ghost" icon="flag" onClick={() => setDialog({ kind: "report", match })}>
                                  Report result
                                </Button>
                              )}
                            </div>
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {dialog?.kind === "declare" && (
        <DeclareScoreDialog tournament={tournament} match={dialog.match} entrants={entrants} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "time" && (
        <TimeDialog tournament={tournament} match={dialog.match} entrants={entrants} mode={dialog.mode} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "report" && (
        <ReportMatchDialog tournament={tournament} match={dialog.match} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
