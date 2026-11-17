import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import {
  challengePhaseLabel,
  formatChallengeDateTime,
  isTournamentChallenge,
  sideIds,
  sideNames,
  type ChallengePerspective,
  type ChallengeTone,
} from "../lifecycle";
import type { Challenge } from "../types";
import { StatusTag } from "./StatusTag";

function Contender({
  name,
  role,
  own,
  ownLabel,
  winner,
  align,
}: {
  name: string;
  role: string;
  own: boolean;
  ownLabel: string;
  winner: boolean;
  align: "start" | "end";
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3 sm:gap-4", align === "end" ? "items-end text-right" : "items-start")}>
      <Avatar
        name={name}
        size="xl"
        tone={own ? "brand" : "ink"}
        className={cn(
          "rounded-full ring-4 ring-offset-0 transition-shadow [&>span]:size-16 [&>span]:text-lg sm:[&>span]:size-24 sm:[&>span]:text-2xl",
          winner ? "ring-signal/70" : "ring-transparent",
        )}
      />
      <div className="min-w-0 max-w-full">
        <p className="type-display truncate text-lg leading-tight sm:text-[1.7rem]">{name}</p>
        <p className="mt-1 text-xs text-mist-400 sm:text-sm">
          {role}
          {own && <span className="text-lavender-300"> · {ownLabel}</span>}
        </p>
      </div>
    </div>
  );
}

export function VersusStage({
  challenge,
  view,
  tone,
}: {
  challenge: Challenge;
  view: ChallengePerspective;
  tone: ChallengeTone;
}) {
  const [challenger, challenged] = sideNames(challenge);
  const [challengerId, challengedId] = sideIds(challenge);
  const winner = challenge.result?.winnerId;
  const score = challenge.result?.score;
  const meta = [challenge.game, challenge.format, challenge.teamSize ? `${challenge.teamSize}v${challenge.teamSize}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      aria-label="Match"
      className="relative overflow-hidden rounded-panel bg-ink-900 px-5 py-6 ring-1 ring-inset ring-white/8 sm:px-10 sm:py-9"
    >
      <div
        aria-hidden="true"
        className="halftone absolute inset-0 text-lavender-400/8 mask-[radial-gradient(60%_80%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-linear-to-b from-lavender-400/30 via-white/5 to-transparent"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusTag tone={tone}>{challengePhaseLabel(challenge)}</StatusTag>
          {isTournamentChallenge(challenge) && (
            <span className="type-label flex items-center gap-1.5 text-mist-400">
              <Icon name="trophy" className="size-3.5" />
              {challenge.tournamentLabel ?? "Tournament match"}
            </span>
          )}
        </div>
        <span className="type-label text-mist-400">{meta}</span>
      </div>

      <div className="relative mt-8 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:mt-10 sm:gap-8">
        <Contender
          name={challenger}
          role={challenge.type === "team" ? "Challenging team" : "Challenger"}
          own={view.side === "challenger"}
          ownLabel={challenge.type === "team" ? "Your team" : "You"}
          winner={Boolean(winner) && winner === challengerId}
          align="start"
        />
        <div className="grid justify-items-center gap-2 text-center">
          {score ? (
            <>
              <span className="type-display text-4xl tabular-nums leading-none sm:text-6xl">{score.replace("-", "–")}</span>
              <span
                className={cn(
                  "type-label flex items-center gap-1.5",
                  winner === "draw" ? "text-mist-400" : "text-signal",
                )}
              >
                {winner !== "draw" && <Icon name="verified" weight="fill" className="size-3.5" />}
                {winner === "draw" ? "Draw" : "Final"}
              </span>
            </>
          ) : (
            <span className="font-serif text-4xl italic leading-none text-lavender-300 sm:text-6xl">vs</span>
          )}
        </div>
        <Contender
          name={challenged}
          role={challenge.type === "team" ? "Challenged team" : "Challenged"}
          own={view.side === "challenged"}
          ownLabel={challenge.type === "team" ? "Your team" : "You"}
          winner={Boolean(winner) && winner === challengedId}
          align="end"
        />
      </div>

      <p className="relative mt-8 flex items-center justify-center gap-2 text-sm text-mist-300 sm:mt-10">
        <Icon name="calendar" className="size-4 text-lavender-300" />
        <time dateTime={challenge.scheduledDate}>{formatChallengeDateTime(challenge.scheduledDate)}</time>
      </p>
    </section>
  );
}
