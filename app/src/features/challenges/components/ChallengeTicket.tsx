import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import {
  challengePhase,
  challengePhaseLabel,
  isClosedPhase,
  isTournamentChallenge,
  nextStep,
  sideNames,
  type ChallengePerspective,
} from "../lifecycle";
import { outcomeLabels, viewerOutcome } from "../outcome";
import type { Challenge } from "../types";
import { StatusTag } from "./StatusTag";

function Side({ name, own }: { name: string; own: boolean }) {
  return <span className={cn("min-w-0 truncate", own ? "text-lavender-200" : "text-mist-50")}>{name}</span>;
}

export function ChallengeTicket({
  challenge,
  view,
  userId,
  responding,
  onRespond,
}: {
  challenge: Challenge;
  view: ChallengePerspective;
  userId?: string;
  responding: boolean;
  onRespond: (status: "accepted" | "rejected") => void;
}) {
  const scheduled = new Date(challenge.scheduledDate);
  const phase = challengePhase(challenge);
  const step = nextStep(challenge, view, userId);
  const [challenger, challenged] = sideNames(challenge);
  const outcome = viewerOutcome(challenge, view);
  const closed = isClosedPhase(phase);
  // Team challenges need a lineup to accept, which happens on the detail page.
  const quickAnswer =
    phase === "pending" && view.incoming && challenge.type === "user" && !isTournamentChallenge(challenge);
  const href = `/challenges/${challenge.id}`;
  const ownName = (side: "challenger" | "challenged", name: string) =>
    view.side === side && challenge.type === "user" ? "You" : name;

  return (
    <article
      className={cn(
        "group relative flex overflow-hidden rounded-card bg-ink-900/60 ring-1 ring-inset transition-[background-color,box-shadow] duration-300 hover:bg-ink-900",
        step.tone === "action" ? "ring-lavender-400/30" : "ring-white/6",
      )}
    >
      <div
        className={cn(
          "relative grid w-20 shrink-0 content-center justify-items-center gap-0.5 border-r border-dashed border-white/10 py-4 sm:w-24",
          closed && "opacity-60",
        )}
      >
        <span className="type-label text-mist-500">
          {new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(scheduled)}
        </span>
        <span className="type-display text-2xl leading-none tabular-nums">{scheduled.getDate()}</span>
        <span className="type-label text-mist-500">
          {new Intl.DateTimeFormat(undefined, { month: "short" }).format(scheduled)}
        </span>
        <span className="mt-1.5 text-xs tabular-nums text-mist-400">
          {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(scheduled)}
        </span>
        <span aria-hidden="true" className="absolute -right-2 -top-2 size-4 rounded-full bg-ink-950" />
        <span aria-hidden="true" className="absolute -bottom-2 -right-2 size-4 rounded-full bg-ink-950" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag tone={step.tone}>{challengePhaseLabel(challenge)}</StatusTag>
            {isTournamentChallenge(challenge) && (
              <span className="type-label flex items-center gap-1.5 text-mist-500">
                <Icon name="trophy" className="size-3.5" />
                {challenge.tournamentLabel ?? "Tournament match"}
              </span>
            )}
            {challenge.type === "team" && <span className="type-label text-mist-500">Team</span>}
          </div>
          <Link
            to={href}
            className="mt-3 flex min-w-0 items-baseline gap-2.5 text-[1.05rem] font-semibold after:absolute after:inset-0 after:content-['']"
          >
            <Side name={ownName("challenger", challenger)} own={view.side === "challenger"} />
            <span className="shrink-0 font-serif text-base italic text-mist-500">vs</span>
            <Side name={ownName("challenged", challenged)} own={view.side === "challenged"} />
          </Link>
          <p className="mt-1 truncate text-sm text-mist-400">
            {[challenge.game, challenge.format, challenge.teamSize ? `${challenge.teamSize}v${challenge.teamSize}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
          {quickAnswer ? (
            <>
              <Button size="sm" tone="ghost" disabled={responding} onClick={() => onRespond("rejected")}>
                Decline
              </Button>
              <Button size="sm" disabled={responding} onClick={() => onRespond("accepted")}>
                Accept
              </Button>
            </>
          ) : outcome ? (
            <span className="flex items-baseline gap-3">
              {challenge.result?.score && (
                <span className="type-display text-xl tabular-nums leading-none">
                  {challenge.result.score.replace("-", "–")}
                </span>
              )}
              <span className={cn("type-label", outcome === "win" ? "text-lavender-300" : "text-mist-500")}>
                {outcomeLabels[outcome]}
              </span>
            </span>
          ) : step.tone === "action" && step.cta ? (
            <span className="flex items-center gap-1.5 text-sm font-medium text-lavender-300">
              {step.cta}
              <Icon name="arrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          ) : (
            <Icon
              name="arrowRight"
              className="hidden size-4 text-mist-500 transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-mist-200 sm:block"
            />
          )}
        </div>
      </div>
    </article>
  );
}
