import { Button, LinkButton } from "@/components/ui/Button";
import { SkeletonText } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { usePlayerMatchHistory } from "../hooks";
import { getMatchPresentation } from "../matchHistory";
import type { MatchHistoryEntry, PlayerProfile } from "../types";
import { ProfileSection } from "./ProfileSection";

const sourceLabels: Record<NonNullable<MatchHistoryEntry["verificationSource"]>, string> = {
  challenge: "Challenge result",
  tournament: "Tournament result",
  organiser: "Organiser recorded",
  screenshot: "Screenshot verified",
  player_listed: "Player listed",
  official_api: "Official game data",
};

const resultStyles: Record<string, { mark: string; className: string }> = {
  win: { mark: "W", className: "bg-signal/12 text-signal" },
  loss: { mark: "L", className: "bg-white/6 text-mist-400" },
  draw: { mark: "D", className: "bg-lavender-400/12 text-lavender-300" },
};

function gameName(value: MatchHistoryEntry["game"]) {
  if (typeof value === "string") return value;
  return value?.name || "Game";
}

function MatchRow({ match, playerId }: { match: MatchHistoryEntry; playerId: string }) {
  const presentation = getMatchPresentation(match, playerId);
  const result = resultStyles[presentation.state];
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
        <p className="truncate text-sm font-semibold">{gameName(match.game)}</p>
        <p className="mt-0.5 truncate text-xs text-mist-400">{details.join(" · ") || "Gamerie match"}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums">{presentation.label}</p>
        {match.verificationSource && (
          <p className="mt-0.5 text-xs text-mist-500">{sourceLabels[match.verificationSource]}</p>
        )}
      </div>
    </li>
  );
}

export function ProfileMatches({ own, profile }: { own: boolean; profile: PlayerProfile }) {
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
