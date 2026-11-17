import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { SkeletonText } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { usePlayerChallenges } from "@/features/challenges/hooks";
import { challengePerspective, challengePhaseLabel, formatChallengeDateTime, sideNames } from "@/features/challenges/lifecycle";
import { viewerOutcome } from "@/features/challenges/outcome";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { usePlayerMatchHistory } from "../hooks";
import { getMatchPresentation, matchGameName, matchResultStyles, matchSourceLabels } from "../matchHistory";
import type { MatchHistoryEntry, PlayerProfile } from "../types";
import { ProfileSection } from "./ProfileSection";

function MatchRow({ match, playerId }: { match: MatchHistoryEntry; playerId: string }) {
  const presentation = getMatchPresentation(match, playerId);
  const result = matchResultStyles[presentation.state];
  const date = match.playedAt || match.scheduledDate || match.date || match.createdAt;
  const details = [
    presentation.opponent ? `vs ${presentation.opponent}` : null,
    date ? new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null,
    match.eventName || null,
  ].filter(Boolean);

  return (
    <li className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
          result?.className ?? "bg-white/6 text-mist-400",
        )}
        aria-label={presentation.state}
      >
        {result?.mark ?? "–"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{matchGameName(match.game)}</p>
        <p className="mt-0.5 truncate text-xs text-mist-400">{details.join(" · ") || "Gamerie match"}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums">{presentation.label}</p>
        {match.verificationSource && (
          <p className="mt-0.5 text-xs text-mist-500">{matchSourceLabels[match.verificationSource]}</p>
        )}
      </div>
    </li>
  );
}

function RecordedMatches({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const query = usePlayerMatchHistory(profile.id);
  const pages = query.data?.pages ?? [];
  const matches = pages.flatMap((page) => page.data);
  const total = pages[0]?.total ?? 0;

  if (query.isLoading)
    return (
      <ProfileSection title="Recorded matches">
        <SkeletonText lines={4} />
      </ProfileSection>
    );

  if (query.isError && !query.data)
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="Matches could not load"
        description={getApiErrorMessage(query.error, "Please try again in a moment.")}
        action={
          <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );

  if (!matches.length)
    return (
      <StatePanel
        icon="matches"
        title={own ? "No recorded matches yet" : "No recorded matches"}
        description={
          own
            ? "Results from challenges, tournaments and logged matches build your record here."
            : "This player hasn't recorded any verified matches yet."
        }
        action={
          own ? (
            <LinkButton to="/matches/log" tone="outline" size="sm" icon="plus">
              Log a match
            </LinkButton>
          ) : undefined
        }
      />
    );

  return (
    <ProfileSection
      title="Recorded matches"
      meta={
        <span className="flex items-center gap-4">
          {total} recorded
          {own && (
            <LinkButton to="/matches/log" tone="ghost" size="sm" icon="plus" className="-mr-3">
              Log match
            </LinkButton>
          )}
        </span>
      }
    >
      <ul className="divide-y divide-white/6">
        {matches.map((match, index) => (
          <MatchRow key={match.id || index} match={match} playerId={profile.id} />
        ))}
      </ul>
      {query.hasNextPage && (
        <div className="mt-5 flex items-center justify-center gap-4">
          {query.isFetchNextPageError && <span className="text-sm text-danger">Older records could not load.</span>}
          <Button tone="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
            {query.isFetchingNextPage ? "Loading" : query.isFetchNextPageError ? "Try again" : "Load more"}
          </Button>
        </div>
      )}
    </ProfileSection>
  );
}

function ChallengeHistory({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const query = usePlayerChallenges(profile.id);
  const challenges = query.data?.pages.flatMap((page) => page.data) ?? [];

  if (query.isLoading)
    return (
      <ProfileSection title="Challenges">
        <SkeletonText lines={4} />
      </ProfileSection>
    );
  if (query.isError && !query.data)
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="Challenges could not load"
        description={getApiErrorMessage(query.error, "Please try again in a moment.")}
        action={
          <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );
  if (!challenges.length)
    return (
      <StatePanel
        icon="challenges"
        title="No challenges yet"
        description={own ? "Challenge any player. Once you both confirm the score, it shows here." : "This player hasn't played a challenge yet."}
        action={
          <LinkButton
            to={own ? "/challenges/new" : `/challenges/new?target=${encodeURIComponent(profile.id)}&targetName=${encodeURIComponent(profile.username)}`}
            tone="outline"
            size="sm"
            icon="challenges"
          >
            {own ? "New challenge" : `Challenge ${profile.username}`}
          </LinkButton>
        }
      />
    );

  return (
    <ProfileSection title="Challenges" meta={`${query.data?.pages[0]?.total ?? challenges.length} played or scheduled`}>
      <ul className="divide-y divide-white/6">
        {challenges.map((challenge) => {
          const view = challengePerspective(challenge, profile.id, []);
          const outcome = viewerOutcome(challenge, view);
          const opponent = view.side ? view.opponentName : sideNames(challenge).join(" vs ");
          const row = (
            <>
              <span
                className={cn(
                  "type-display grid size-9 shrink-0 place-items-center rounded-xl text-sm",
                  outcome === "win" ? "bg-signal/12 text-signal" : outcome === "loss" ? "bg-white/5 text-mist-400" : "bg-white/5 text-mist-300",
                )}
              >
                {outcome === "win" ? "W" : outcome === "loss" ? "L" : outcome === "draw" ? "D" : "–"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {view.side ? <>vs {opponent}</> : opponent}
                </span>
                <span className="mt-0.5 block truncate text-xs text-mist-500">
                  {[challenge.game, challenge.format, formatChallengeDateTime(challenge.scheduledDate)].join(" · ")}
                </span>
              </span>
              <span className="shrink-0 text-right">
                {challenge.result?.score ? (
                  <span className="type-display block text-base tabular-nums">{challenge.result.score.replace("-", "–")}</span>
                ) : (
                  <span className="type-label block text-mist-500">{challengePhaseLabel(challenge)}</span>
                )}
              </span>
            </>
          );
          return (
            <li key={challenge.id}>
              {own ? (
                <Link to={`/challenges/${challenge.id}`} className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-white/3">
                  {row}
                </Link>
              ) : (
                <div className="flex items-center gap-4 py-3">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
      {query.hasNextPage && (
        <div className="mt-5 flex justify-center">
          <Button tone="outline" size="sm" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
            {query.isFetchingNextPage ? "Loading" : "Load more"}
          </Button>
        </div>
      )}
    </ProfileSection>
  );
}

export function ProfileMatches({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const [view, setView] = useState<"matches" | "challenges">("matches");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <Segmented
        label="Show"
        value={view}
        onChange={setView}
        options={[
          { value: "matches", label: "Recorded matches" },
          { value: "challenges", label: "Challenges" },
        ]}
        className="w-fit"
      />
      {view === "matches" ? <RecordedMatches own={own} profile={profile} /> : <ChallengeHistory own={own} profile={profile} />}
    </div>
  );
}
