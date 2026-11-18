import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import type { LeagueFixtureAction } from "../api";
import { LeagueLoadError } from "../components/LeagueBits";
import { useLeagueActions, useLeagueFixtures } from "../hooks";
import type { LeagueDetail, LeagueFixture, LeagueSeason } from "../types";
import { READY_GRACE_MS, READY_OPENS_MS, fixtureScore, formatLeagueDate, formatMatchTime } from "../utils";
import { DisputeDialog, ProposeTimeDialog, ResultDialog } from "./LeagueDialogs";

const OPEN_STATUSES = ["scheduled", "open", "reported", "disputed"];

function useNow(interval = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);
  return now;
}

const statusCopy: Record<LeagueFixture["status"], string> = {
  scheduled: "Scheduled",
  open: "Match open",
  reported: "Result reported",
  disputed: "Disputed",
  final: "Final",
  forfeit: "Forfeit",
  void: "Void",
};

function Side({ name, avatar, team, align, winner }: { name: string; avatar: string | null; team: boolean; align: "left" | "right"; winner: boolean }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", align === "right" && "flex-row-reverse text-right")}>
      <Avatar src={avatar ?? undefined} name={name} size="sm" tone={team ? "ink" : "brand"} className="shrink-0 rounded-full" />
      <span className={cn("min-w-0 truncate text-sm", winner ? "font-semibold text-mist-50" : "text-mist-200")}>{name}</span>
    </span>
  );
}

export function FixtureRow({ fixture, children }: { fixture: LeagueFixture; children?: ReactNode }) {
  const score = fixtureScore(fixture);
  const team = fixture.sideA.kind === "team";
  const mine = fixture.viewerSide !== null;
  return (
    <li className={cn("grid gap-3 rounded-2xl px-4 py-3.5 ring-1 ring-inset", mine ? "bg-lavender-400/6 ring-lavender-400/25" : "bg-white/3 ring-white/6")}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <Side name={fixture.sideA.name} avatar={fixture.sideA.avatar} team={team} align="left" winner={fixture.winner === "a"} />
        <span className="grid justify-items-center gap-0.5 text-center">
          {score ? (
            <span className="text-base font-semibold tabular-nums">{score}</span>
          ) : (
            <span className="text-xs font-medium text-mist-300">{formatMatchTime(fixture.matchAt)}</span>
          )}
          <span className={cn("type-label", fixture.status === "disputed" ? "text-danger" : fixture.status === "open" ? "text-signal" : "text-mist-500")}>{statusCopy[fixture.status]}</span>
        </span>
        <Side name={fixture.sideB.name} avatar={fixture.sideB.avatar} team={team} align="right" winner={fixture.winner === "b"} />
      </div>
      {children}
    </li>
  );
}

type Dialogs = { kind: "propose" | "result" | "dispute"; fixture: LeagueFixture } | null;

function MyMatchActions({ fixture, now, onOpen, act, pending }: { fixture: LeagueFixture; now: number; onOpen: (dialog: Dialogs) => void; act: (fixture: LeagueFixture, action: LeagueFixtureAction, done: string) => void; pending: boolean }) {
  const side = fixture.viewerSide!;
  const at = new Date(fixture.matchAt).getTime();
  const proposalFromThem = Boolean(fixture.proposedAt && fixture.proposedBy && fixture.proposedBy !== side);
  const canMove = ["scheduled", "open"].includes(fixture.status) && at > now;
  const readyWindow = fixture.status === "open" && now >= at - READY_OPENS_MS && now <= at + READY_GRACE_MS;
  const ready = fixture.ready[side];
  const theyReady = fixture.ready[side === "a" ? "b" : "a"];
  const canDeclare = fixture.status === "open" && now >= at;
  const theyDeclared = fixture.status === "reported" && fixture.declaredBy !== side;

  const notes: string[] = [];
  if (fixture.agreedAt) notes.push("Time agreed by both sides");
  else if (fixture.proposedAt && !proposalFromThem) notes.push(`You proposed ${formatMatchTime(fixture.proposedAt)}`);
  if (proposalFromThem) notes.push(`They proposed ${formatMatchTime(fixture.proposedAt)}`);
  if (fixture.status === "open" && !readyWindow && now < at) notes.push("Ready-up opens 15 minutes before the match");
  if (readyWindow) notes.push(ready ? (theyReady ? "Both sides ready" : "You're ready. Waiting for your opponent") : "Ready up within 10 minutes of the start or forfeit");
  if (fixture.status === "reported" && !theyDeclared) notes.push(`Waiting for your opponent to accept${fixture.reportWindowEndsAt ? ` until ${formatMatchTime(fixture.reportWindowEndsAt)}` : ""}`);
  if (theyDeclared) notes.push(`Accept or dispute${fixture.reportWindowEndsAt ? ` before ${formatMatchTime(fixture.reportWindowEndsAt)}` : ""}; after that it stands`);
  if (fixture.status === "disputed") notes.push("Gamerie is reviewing this result");

  const buttons = [
    proposalFromThem && canMove && (
      <Button key="accept-time" size="sm" icon="check" disabled={pending} onClick={() => act(fixture, { kind: "accept-time" }, "Time agreed")}>
        Accept time
      </Button>
    ),
    canMove && (
      <Button key="propose" tone="outline" size="sm" icon="calendar" disabled={pending} onClick={() => onOpen({ kind: "propose", fixture })}>
        {fixture.proposedAt && !proposalFromThem ? "Change proposal" : "Propose a time"}
      </Button>
    ),
    readyWindow && !ready && (
      <Button key="ready" size="sm" icon="check" disabled={pending} onClick={() => act(fixture, { kind: "ready" }, "You're ready")}>
        Ready up
      </Button>
    ),
    canDeclare && (
      <Button key="result" size="sm" icon="flag" disabled={pending} onClick={() => onOpen({ kind: "result", fixture })}>
        Report result
      </Button>
    ),
    theyDeclared && (
      <Button key="accept-result" size="sm" icon="check" disabled={pending} onClick={() => act(fixture, { kind: "accept-result" }, "Result accepted")}>
        Accept {fixtureScore(fixture)}
      </Button>
    ),
    theyDeclared && (
      <Button key="dispute" tone="outline" size="sm" disabled={pending} onClick={() => onOpen({ kind: "dispute", fixture })}>
        Dispute
      </Button>
    ),
  ].filter(Boolean);

  if (!buttons.length && !notes.length) return null;
  return (
    <div className="flex flex-col gap-3 border-t border-white/6 pt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-relaxed text-mist-400">{notes.join(" · ")}</p>
      {buttons.length > 0 && <div className="flex shrink-0 flex-wrap gap-2">{buttons}</div>}
    </div>
  );
}

export function LeagueMatches({ league, season }: { league: LeagueDetail; season: LeagueSeason }) {
  const live = ["in_progress", "playoffs"].includes(season.status);
  const query = useLeagueFixtures(league.id, season.id, live);
  const actions = useLeagueActions(league.id, season.id);
  const now = useNow();
  const [dialog, setDialogState] = useState<Dialogs>(null);
  const setDialog = (next: Dialogs) => {
    actions.fixture.reset();
    setDialogState(next);
  };
  const fixtures = useMemo(() => query.data ?? [], [query.data]);
  const weeks = useMemo(() => [...new Set(fixtures.map((fixture) => fixture.week))].sort((a, b) => a - b), [fixtures]);
  const currentWeek = useMemo(() => fixtures.find((fixture) => OPEN_STATUSES.includes(fixture.status))?.week ?? weeks[weeks.length - 1] ?? 1, [fixtures, weeks]);
  const [week, setWeek] = useState<number | null>(null);
  const shownWeek = week ?? currentWeek;
  const mine = fixtures.filter((fixture) => fixture.viewerSide && OPEN_STATUSES.includes(fixture.status));
  const playoffWeeks = new Set(fixtures.filter((fixture) => fixture.stage === "playoffs").map((fixture) => fixture.week));

  const act = (fixture: LeagueFixture, action: LeagueFixtureAction, done: string) =>
    actions.fixture.mutate(
      { fixtureId: fixture.id, action },
      {
        onSuccess: () => {
          toast.success(done);
          setDialog(null);
        },
        onError: (error) => {
          if (!dialog) toast.error("That didn't go through", getApiErrorMessage(error, "Try again in a moment."));
        },
      },
    );
  const dialogError = actions.fixture.error ? getApiErrorMessage(actions.fixture.error, "That didn't go through.") : undefined;

  if (query.isLoading) return <Skeleton className="h-96 rounded-card" />;
  if (query.isError) return <LeagueLoadError what="matches" error={query.error} onRetry={() => void query.refetch()} />;
  if (!fixtures.length)
    return (
      <StatePanel
        icon="calendar"
        title={season.status === "registration" ? "The schedule comes out when the season starts" : "No matches in this season"}
        description={
          season.status === "registration"
            ? `On ${formatLeagueDate(season.startsAt, true)} Gamerie builds the round robin from everyone entered and opens week 1.`
            : "This season ended without a schedule."
        }
      />
    );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {mine.length > 0 && (
        <section aria-labelledby="my-matches" className="grid gap-3">
          <h2 id="my-matches" className="text-base font-semibold">
            Your matches
          </h2>
          <ul className="grid gap-2.5">
            {mine.map((fixture) => (
              <FixtureRow key={fixture.id} fixture={fixture}>
                <MyMatchActions fixture={fixture} now={now} onOpen={setDialog} act={act} pending={actions.fixture.isPending} />
              </FixtureRow>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="schedule" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="schedule" className="text-base font-semibold">
            Schedule
          </h2>
          <p className="text-xs text-mist-500">Times in your time zone</p>
        </div>
        <div role="tablist" aria-label="Weeks" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
          {weeks.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={value === shownWeek}
              onClick={() => setWeek(value)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3.5 text-sm ring-1 ring-inset transition-colors",
                value === shownWeek ? "bg-lavender-400 font-semibold text-ink-950 ring-lavender-400" : "text-mist-300 ring-white/10 hover:text-mist-50",
              )}
            >
              {playoffWeeks.has(value) ? `Playoffs · W${value}` : `Week ${value}`}
            </button>
          ))}
        </div>
        <ul className="grid gap-2.5">
          {fixtures
            .filter((fixture) => fixture.week === shownWeek)
            .map((fixture) => (
              <FixtureRow key={fixture.id} fixture={fixture} />
            ))}
        </ul>
        {season.status === "in_progress" && (
          <p className="flex items-center gap-2 text-xs text-mist-500">
            <Icon name="clock" className="size-3.5" />A match nobody readies up for is forfeited 10 minutes after its start.
          </p>
        )}
      </section>

      {dialog?.kind === "propose" && (
        <ProposeTimeDialog fixture={dialog.fixture} pending={actions.fixture.isPending} error={dialogError} onClose={() => setDialog(null)} onSubmit={(at) => act(dialog.fixture, { kind: "propose", at }, "Time proposed")} />
      )}
      {dialog?.kind === "result" && (
        <ResultDialog fixture={dialog.fixture} season={season} pending={actions.fixture.isPending} error={dialogError} onClose={() => setDialog(null)} onSubmit={(input) => act(dialog.fixture, { kind: "result", ...input }, "Result reported")} />
      )}
      {dialog?.kind === "dispute" && (
        <DisputeDialog pending={actions.fixture.isPending} error={dialogError} onClose={() => setDialog(null)} onSubmit={(reason) => act(dialog.fixture, { kind: "dispute", reason }, "Dispute sent to the organizer")} />
      )}
    </div>
  );
}
