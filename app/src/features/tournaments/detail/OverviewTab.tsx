import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EntrantLink } from "@/components/ui/EntrantLink";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { hostPath } from "@/lib/paths";
import { toast } from "@/lib/toast";
import { withdrawEntrant } from "../api";
import { EntrantMark } from "../components/EntrantMark";
import { Podium } from "../components/Podium";
import { useNow, useTournamentAction, useTournamentBracket } from "../hooks";
import type { BracketEntrant, HostedTournamentDetail } from "../types";
import { HOST_TYPE_LABELS, entrantStatusLabel, formatMoney, formatShortDateTime, ordinal, untilLabel } from "../utils";
import type { RegisterMode } from "./RegisterDialog";
import { ruleSections } from "./rules";
import type { TournamentTab } from "./TournamentPage";
import { myOpenMatch } from "./viewer";

function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6", className)}>
      <header className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

const withdrawable = ["pending_approval", "registered", "waitlisted", "checked_in"];

function YourEntry({
  tournament,
  entrants,
  onTab,
}: {
  tournament: HostedTournamentDetail;
  entrants: Map<string, BracketEntrant>;
  onTab: (tab: TournamentTab, match?: string) => void;
}) {
  const started = ["live", "paused", "completed"].includes(tournament.phase);
  const bracket = useTournamentBracket(tournament.id, started, tournament.phase === "live");
  const entrant = tournament.viewer.entrant!;
  const next = myOpenMatch(bracket.data, entrant.id);
  const opponentId = next ? (next.sideA.entrantId === entrant.id ? next.sideB.entrantId : next.sideA.entrantId) : null;
  const opponent = opponentId ? entrants.get(opponentId) : undefined;
  const [confirming, setConfirming] = useState(false);
  const withdraw = useTournamentAction(tournament.id, () => withdrawEntrant(tournament.id, entrant.id));
  const canWithdraw =
    entrant.canAct && withdrawable.includes(entrant.status) && ["registration", "check_in"].includes(tournament.phase);

  return (
    <section className="relative overflow-hidden rounded-card bg-lavender-400/6 p-5 ring-1 ring-inset ring-lavender-400/25 sm:p-6">
      <div className="halftone absolute inset-0 text-lavender-300/10 mask-[radial-gradient(60%_90%_at_100%_0%,black,transparent)]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <EntrantMark name={entrant.displayName} size="lg" />
          <div className="min-w-0">
            <p className="type-label text-mist-500">Your entry</p>
            <p className="mt-1.5 truncate text-lg font-semibold">{entrant.displayName}</p>
            <p className="mt-0.5 text-sm text-lavender-200">
              {entrantStatusLabel(entrant.status)}
              {entrant.status === "waitlisted" && entrant.waitlistPosition ? ` · #${entrant.waitlistPosition}` : ""}
            </p>
          </div>
        </div>
        {canWithdraw && (
          <Button tone="ghost" size="sm" onClick={() => setConfirming(true)}>
            Withdraw
          </Button>
        )}
      </div>

      {next && (
        <button
          type="button"
          onClick={() => onTab("matches", next.id)}
          className="group relative mt-5 flex w-full items-center gap-4 rounded-2xl bg-ink-900/70 p-4 text-left ring-1 ring-inset ring-white/8 transition-colors hover:ring-lavender-400/40"
        >
          <span className="type-label shrink-0 text-mist-500">{next.label}</span>
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="shrink-0 font-serif text-lg italic text-lavender-300">vs</span>
            <EntrantMark name={opponent?.name ?? "?"} src={opponent?.avatar} size="sm" />
            <span className="truncate text-sm font-semibold">{opponent?.name ?? "Opponent to be decided"}</span>
          </span>
          <span className="hidden shrink-0 text-sm text-mist-400 sm:block">
            {next.scheduledAt ? formatShortDateTime(next.scheduledAt) : next.deadlineAt ? `Play by ${formatShortDateTime(next.deadlineAt)}` : ""}
          </span>
          <Icon name="arrowRight" className="size-4 text-lavender-300 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      <ConfirmDialog
        open={confirming}
        title="Withdraw from this tournament?"
        description="Your spot opens up for the next on the waitlist. You can register again while entries are open."
        confirmLabel="Withdraw"
        pending={withdraw.isPending}
        error={withdraw.isError ? getApiErrorMessage(withdraw.error, "Couldn't withdraw.") : undefined}
        onConfirm={() =>
          withdraw.mutate(undefined, {
            onSuccess: () => {
              setConfirming(false);
              toast.info("You've withdrawn", tournament.name);
            },
          })
        }
        onClose={() => setConfirming(false)}
      />
    </section>
  );
}

function Schedule({ tournament }: { tournament: HostedTournamentDetail }) {
  const now = useNow();
  const milestones = [
    { label: "Entries close", when: tournament.registrationClosesAt, phases: ["registration"] },
    { label: "Check-in", when: tournament.checkInOpensAt, until: tournament.checkInClosesAt, phases: ["check_in"] },
    { label: "Bracket starts", when: tournament.startsAt, phases: ["awaiting_start", "live", "paused"] },
    ...(tournament.completedAt ? [{ label: "Finished", when: tournament.completedAt, phases: ["completed"] }] : []),
  ];

  return (
    <ol className="grid gap-0">
      {milestones.map((item, index) => {
        const at = item.when ? new Date(item.when).getTime() : null;
        const current = item.phases.includes(tournament.phase);
        const past = !current && at !== null && at < now;
        return (
          <li key={item.label} className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-4 pb-6 last:pb-0">
            {index < milestones.length - 1 && (
              <span aria-hidden="true" className={cn("absolute left-3 top-7 h-[calc(100%-1.5rem)] w-px", past ? "bg-lavender-400/40" : "bg-white/10")} />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 grid size-6 place-items-center rounded-full ring-1 ring-inset",
                past && "bg-lavender-400 text-ink-950 ring-lavender-400",
                current && "bg-lavender-400/14 ring-lavender-400/60",
                !past && !current && "ring-white/12",
              )}
            >
              {past ? (
                <Icon name="check" weight="bold" className="size-3" />
              ) : (
                <span className={cn("size-1.5 rounded-full", current ? "animate-pulse bg-lavender-300 motion-reduce:animate-none" : "bg-white/20")} />
              )}
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", !past && !current && "text-mist-300")}>
                {item.label}
                {current && <span className="ml-2 text-xs font-medium text-lavender-300">Now</span>}
              </p>
              <p className="mt-0.5 text-sm text-mist-400">
                {item.when ? formatShortDateTime(item.when) : "To be set"}
                {"until" in item && item.until ? ` – ${formatShortDateTime(item.until)}` : ""}
                {item.when && at !== null && at > now && <span className="text-mist-500"> · {untilLabel(item.when, now)}</span>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OverviewTab({
  tournament,
  onTab,
  onRegister,
}: {
  tournament: HostedTournamentDetail;
  onTab: (tab: TournamentTab, match?: string) => void;
  onRegister: (mode: RegisterMode) => void;
}) {
  const started = ["live", "paused", "completed"].includes(tournament.phase);
  const bracket = useTournamentBracket(tournament.id, started, tournament.phase === "live");
  const entrants = new Map<string, BracketEntrant>((bracket.data?.entrants ?? []).map((entrant) => [entrant.id, entrant]));
  const keyRules = ruleSections(tournament).flatMap((section) => section.rules).slice(0, 4);
  const prize = tournament.prize;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="grid gap-6">
        {tournament.viewer.entrant && <YourEntry tournament={tournament} entrants={entrants} onTab={onTab} />}
        {!tournament.viewer.entrant && tournament.viewer.canRegister && (
          <section className="flex flex-col gap-4 rounded-card bg-lavender-400/6 p-5 ring-1 ring-inset ring-lavender-400/25 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-base font-semibold">Entries are open</p>
              <p className="mt-1 text-sm text-mist-400">
                {tournament.bracketSize
                  ? `${Math.max(0, tournament.bracketSize - tournament.entrantCount)} of ${tournament.bracketSize} spots left.`
                  : "Spots are open."}{" "}
                {tournament.registrationClosesAt && `Closes ${untilLabel(tournament.registrationClosesAt)}.`}
              </p>
            </div>
            <Button icon="ticket" onClick={() => onRegister({ kind: "register" })}>
              Register
            </Button>
          </section>
        )}
        {tournament.phase === "completed" && bracket.data && <Podium bracket={bracket.data} />}
        <Panel title="About">
          <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-mist-300">
            {tournament.description || "The organizer hasn't added a description yet."}
          </p>
          {tournament.venue && (
            <p className="mt-4 flex items-start gap-2 text-sm text-mist-300">
              <Icon name="mapPin" className="mt-0.5 size-4 shrink-0 text-lavender-300" />
              {tournament.venue.name}, {tournament.venue.address}
            </p>
          )}
        </Panel>
        <Panel title="Schedule">
          <Schedule tournament={tournament} />
        </Panel>
      </div>

      <aside className="grid gap-6">
        <Panel title="Prize">
          {prize?.total ? (
            <>
              <p className="type-display text-3xl leading-none text-lavender-200">{formatMoney(prize.total, prize.currency)}</p>
              {prize.split?.length ? (
                <ol className="mt-5 grid gap-2">
                  {prize.split.map((row) => (
                    <li key={row.placement} className="flex items-center justify-between rounded-xl bg-white/3 px-3 py-2 text-sm ring-1 ring-inset ring-white/6">
                      <span className={cn("font-medium", row.placement === 1 ? "text-signal" : "text-mist-300")}>{ordinal(row.placement)}</span>
                      <span className="font-semibold tabular-nums">{formatMoney(row.amount, prize.currency)}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              {prize.description && <p className="mt-4 text-sm leading-relaxed text-mist-400">{prize.description}</p>}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-mist-400">No prize. Results still go on every player's Gamerie record.</p>
          )}
        </Panel>

        <Panel
          title="Key rules"
          action={
            <button type="button" onClick={() => onTab("rules")} className="text-sm font-medium text-mist-400 hover:text-lavender-200">
              All rules
            </button>
          }
        >
          <ul className="grid gap-3">
            {keyRules.map((rule) => (
              <li key={rule} className="flex gap-3 text-sm leading-relaxed text-mist-300">
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-lavender-300" />
                {rule}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Organizer">
          <EntrantLink to={tournament.official ? null : hostPath(tournament.host)} className="flex items-center gap-3">
            <EntrantMark name={tournament.host.name ?? "Gamerie"} src={tournament.host.logo} />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{tournament.official ? "Gamerie" : tournament.host.name}</span>
              <span className="block text-sm text-mist-400">
                {tournament.official ? "Official tournament" : tournament.host.type ? HOST_TYPE_LABELS[tournament.host.type] : "Host"}
              </span>
            </span>
          </EntrantLink>
        </Panel>
      </aside>
    </div>
  );
}
