import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/features/auth/authStore";
import { useUpcomingEvents } from "@/features/calendar/hooks";
import { useChallengeSummary } from "@/features/challenges/hooks";
import type { Challenge } from "@/features/challenges/types";
import { useCommunityInvites, useUserTeams } from "@/features/communities/hooks";
import { usePlayerSuggestions } from "@/features/discovery/hooks";
import { useGameConnections } from "@/features/games/hooks";
import { usePlayerConnections, usePlayerProfile } from "@/features/profile/hooks";
import { CompletionMeter } from "@/features/profile/components/CompletionMeter";
import { useProgressionGuide } from "@/features/progression/hooks";
import { useOpenTournaments } from "@/features/tournaments/hooks";
import { HomePanel, PanelError } from "./components/HomePanel";
import { LevelCard } from "./components/LevelCard";
import { NeedsYou, type PendingInvite } from "./components/NeedsYou";
import { OpenTournaments } from "./components/OpenTournaments";
import { PlayersToFollow } from "./components/PlayersToFollow";
import { QuickStart } from "./components/QuickStart";
import { SetupQuest } from "./components/SetupQuest";
import { UpNext } from "./components/UpNext";
import { YourTeams } from "./components/YourTeams";
import { YourCompetitions } from "./components/YourCompetitions";
import { formatToday, formatWhen, greetingFor } from "./format";
import { buildSetupSteps } from "./setupSteps";

function readHidden(key: string) {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function saveHidden(key: string, hidden: boolean) {
  try {
    if (hidden) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    // The choice still applies for this visit.
  }
}

function uniqueById(challenges: Challenge[]) {
  return [...new Map(challenges.map((challenge) => [challenge.id, challenge])).values()];
}

function SetupSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <div className="grid gap-4 rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
        <Skeleton className="h-4 w-44 rounded-full" />
        <Skeleton className="h-1 rounded-full" />
        <Skeleton className="h-28" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const profile = usePlayerProfile(user?.username || user?.id);
  const guide = useProgressionGuide();
  const connections = useGameConnections();
  const followingPages = usePlayerConnections(user?.id ?? "", "following", Boolean(user?.id));
  const teams = useUserTeams(user?.id);
  const history = useChallengeSummary({ scope: "history", direction: "all" });
  const incoming = useChallengeSummary({ scope: "for-you", direction: "received", status: "pending" });
  const teamIncoming = useChallengeSummary({ scope: "team", direction: "received", status: "pending" });
  const teamInvites = useCommunityInvites("teams");
  const hubInvites = useCommunityInvites("hubs");
  const upcoming = useUpcomingEvents(4);
  const suggestions = usePlayerSuggestions();
  const tournaments = useOpenTournaments(3);
  const hiddenKey = `Gamerie_setup_hidden_${user?.id}`;
  const [setupHidden, setSetupHidden] = useState(() => readHidden(hiddenKey));

  const setupReady = profile.isSuccess && !connections.isLoading && !followingPages.isLoading && !teams.isLoading && !history.isLoading;
  const steps = useMemo(
    () =>
      profile.data && setupReady
        ? buildSetupSteps({
            profile: profile.data,
            guide: guide.data,
            connectionCount: connections.data?.length ?? 0,
            followingCount: followingPages.data?.pages[0]?.total ?? 0,
            teamCount: teams.data?.length ?? 0,
            challengeCount: history.data?.data.filter((challenge) => challenge.status === "completed").length ?? 0,
          })
        : null,
    [profile.data, setupReady, guide.data, connections.data, followingPages.data, teams.data, history.data],
  );

  const challenges = uniqueById([...(incoming.data?.data ?? []), ...(teamIncoming.data?.data ?? [])]);
  const invites: PendingInvite[] = [
    ...(teamInvites.data ?? []).map((invite) => ({ kind: "team" as const, invite })),
    ...(hubInvites.data ?? []).map((invite) => ({ kind: "hub" as const, invite })),
  ];

  if (!user) return null;

  const name = profile.data?.username ?? user.username ?? "player";
  const done = steps?.filter((step) => step.complete).length ?? 0;
  const remaining = steps ? steps.length - done : 0;
  const newPlayer = Boolean(steps) && done === 0;
  const needsCount = challenges.length + invites.length;
  const nextEvent = upcoming.data?.events[0];

  const summary = needsCount
    ? `${needsCount} ${needsCount === 1 ? "thing needs" : "things need"} your answer.`
    : newPlayer
      ? "This is your home on Gamerie. Challenges, invites and your next matches land here."
      : nextEvent
        ? `Next up: ${nextEvent.title}, ${formatWhen(nextEvent.startTime)}.`
        : remaining && !setupHidden
          ? `${remaining} ${remaining === 1 ? "move" : "moves"} left to finish your player ID.`
          : steps
            ? "Your calendar is clear. Challenge someone, or find a tournament to enter."
            : null;
  const setSetupVisibility = (hidden: boolean) => {
    saveHidden(hiddenKey, hidden);
    setSetupHidden(hidden);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <header>
        <p className="type-label text-mist-500">{formatToday()}</p>
        <h1 className="type-display mt-4 text-heading">
          {newPlayer ? "Welcome" : greetingFor()}, <span className="text-lavender-300">{name}</span>
        </h1>
        <p className="mt-3 min-h-6 max-w-xl text-[0.95rem] leading-relaxed text-mist-300">{summary}</p>
      </header>

      <QuickStart />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)] lg:gap-6">
          <NeedsYou className="order-2 lg:order-none" challenges={challenges} invites={invites} />
          <YourCompetitions className="order-2 lg:order-none" />
          {profile.data && <CompletionMeter profile={profile.data} className="order-3 lg:order-none" />}
          {setupHidden ? null : profile.isError ? (
            <HomePanel className="order-3 lg:order-none" title="Set up your player ID">
              <PanelError onRetry={() => void profile.refetch()} />
            </HomePanel>
          ) : !steps ? (
            <SetupSkeleton className="order-3 lg:order-none" />
          ) : (
            remaining > 0 && (
              <SetupQuest
                className="order-3 lg:order-none"
                steps={steps}
                onHide={() => setSetupVisibility(true)}
              />
            )
          )}
          <UpNext
            className="order-4 lg:order-none"
            events={upcoming.data?.events ?? []}
            loading={upcoming.isLoading}
            failed={upcoming.isError}
            onRetry={() => void upcoming.refetch()}
          />
          {!tournaments.isError && (
            <OpenTournaments
              className="order-5 lg:order-none"
              tournaments={tournaments.data?.tournaments ?? []}
              loading={tournaments.isLoading}
            />
          )}
        </div>

        <div className="contents lg:grid lg:grid-cols-[minmax(0,1fr)] lg:gap-6">
          <LevelCard
            className="order-1 lg:order-none"
            profile={{
              username: name,
              profileImage: profile.data?.profileImage ?? user.profileImage,
              gamerieId: profile.data?.gamerieId,
            }}
            guide={guide.data}
            loading={guide.isLoading}
            failed={guide.isError}
            onRetry={() => void guide.refetch()}
            setup={
              setupHidden && steps && remaining > 0
                ? { done, total: steps.length, onResume: () => setSetupVisibility(false) }
                : undefined
            }
          />
          <PlayersToFollow
            className="order-6 lg:order-none"
            players={suggestions.data?.data ?? []}
            currentUserId={user.id}
            loading={suggestions.isLoading}
            failed={suggestions.isError}
            onRetry={() => void suggestions.refetch()}
          />
          <YourTeams
            className="order-7 lg:order-none"
            teams={teams.data ?? []}
            loading={teams.isLoading}
            failed={teams.isError}
            onRetry={() => void teams.refetch()}
          />
        </div>
      </div>
    </div>
  );
}
