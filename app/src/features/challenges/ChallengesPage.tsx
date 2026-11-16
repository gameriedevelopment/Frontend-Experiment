import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { useAuthStore } from "@/features/auth/authStore";
import { useOwnedTeams } from "@/features/communities/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { ChallengeComposer } from "./components/ChallengeComposer";
import { ChallengeTicket } from "./components/ChallengeTicket";
import { useMyChallenges, useUpdateChallenge } from "./hooks";
import { challengePerspective, nextStep, type ChallengeTone } from "./lifecycle";
import type { Challenge, ChallengeDirection, ChallengeFilters, ChallengeScope, ChallengeType } from "./types";

const scopes: Array<{ id: ChallengeScope; label: string }> = [
  { id: "for-you", label: "For you" },
  { id: "team", label: "Team" },
  { id: "history", label: "History" },
];
const directions: Array<{ value: ChallengeDirection; label: string }> = [
  { value: "all", label: "All" },
  { value: "received", label: "Received" },
  { value: "sent", label: "Sent" },
];
const statuses: Array<{ value: "all" | "pending" | "accepted"; label: string }> = [
  { value: "all", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
];
const groups: Array<{ id: string; title: string; tones: ChallengeTone[] }> = [
  { id: "action", title: "Needs you", tones: ["action", "alert"] },
  { id: "upcoming", title: "Coming up", tones: ["upcoming"] },
  { id: "waiting", title: "Waiting on others", tones: ["waiting"] },
  { id: "other", title: "Other", tones: ["done", "closed"] },
];

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-[7.5rem] rounded-card" />
      ))}
    </div>
  );
}

export function ChallengesPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { owned: ownedTeams } = useOwnedTeams(user?.id);
  const ownedTeamIds = useMemo(() => ownedTeams.map((team) => team.id), [ownedTeams]);

  const requestedScope = params.get("view") as ChallengeScope | null;
  const scope: ChallengeScope = scopes.some((item) => item.id === requestedScope) ? requestedScope! : "for-you";
  const requestedDirection = params.get("direction") as ChallengeDirection | null;
  const direction = directions.some((item) => item.value === requestedDirection) ? requestedDirection! : "all";
  const status = (params.get("status") as "pending" | "accepted" | null) ?? "all";
  const [search, setSearch] = useState(params.get("q") ?? "");
  const term = useDebouncedValue(search.trim());

  const filters = useMemo<ChallengeFilters>(
    () => ({ scope, direction, status: scope === "history" ? "all" : status, searchTerm: term || undefined }),
    [direction, scope, status, term],
  );
  const query = useMyChallenges(filters);
  const respond = useUpdateChallenge();
  const challenges = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data]);

  const setParam = (key: string, value?: string) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    setParams(
      (current) => {
        if ((current.get("q") ?? "") === term) return current;
        const next = new URLSearchParams(current);
        if (term) next.set("q", term);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [setParams, term]);

  const changeScope = (next: ChallengeScope) =>
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (next === "for-you") updated.delete("view");
        else updated.set("view", next);
        updated.delete("status");
        updated.delete("direction");
        return updated;
      },
      { replace: true },
    );

  const composing = params.get("compose");
  const composeType: ChallengeType = composing === "team" ? "team" : "user";
  const presetTarget = params.get("target")
    ? { value: params.get("target")!, label: params.get("targetName") || "Selected opponent" }
    : null;
  const openComposer = () => setParam("compose", "user");
  const closeComposer = () =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        ["compose", "target", "targetName"].forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );

  const views = useMemo(
    () =>
      challenges.map((challenge) => {
        const view = challengePerspective(challenge, user?.id, ownedTeamIds);
        return { challenge, view, tone: nextStep(challenge, view, user?.id).tone };
      }),
    [challenges, ownedTeamIds, user?.id],
  );
  const grouped = scope !== "history" && direction === "all" && status === "all" && !term;
  const sections = grouped
    ? groups
        .map((group) => ({ ...group, items: views.filter((item) => group.tones.includes(item.tone)) }))
        .filter((group) => group.items.length)
    : [{ id: "all", title: "", items: views }];

  const renderTicket = ({ challenge, view }: { challenge: Challenge; view: ReturnType<typeof challengePerspective> }) => (
    <ChallengeTicket
      key={challenge.id}
      challenge={challenge}
      view={view}
      userId={user?.id}
      responding={respond.isPending && respond.variables?.id === challenge.id}
      onRespond={(nextStatus) =>
        respond.mutate({ id: challenge.id, type: challenge.type, updates: { status: nextStatus } })
      }
    />
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        eyebrow="Compete"
        title="Challenges"
        description="Play anyone on Gamerie. Agree the terms, play, then confirm the score. Results go on both records."
        actions={
          <Button icon="plus" onClick={openComposer}>
            New challenge
          </Button>
        }
      />

      <div className="grid gap-5">
        <Tabs label="Challenge views" items={scopes} value={scope} onChange={changeScope} indicatorId="challenge-scope" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search challenges</span>
            <Icon
              name="search"
              className="pointer-events-none absolute inset-y-0 left-4 my-auto size-[1.1rem] text-mist-500"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by player, team or game"
              className={cn(inputClasses, "h-11 pl-11 text-sm")}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Segmented
              label="Direction"
              options={directions}
              value={direction}
              onChange={(value) => setParam("direction", value === "all" ? undefined : value)}
            />
            {scope !== "history" && (
              <Segmented
                label="Status"
                options={statuses}
                value={status}
                onChange={(value) => setParam("status", value === "all" ? undefined : value)}
              />
            )}
          </div>
        </div>
      </div>

      {query.isLoading ? (
        <ListSkeleton />
      ) : query.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="Challenges didn't load"
          description={getApiErrorMessage(query.error, "Gamerie couldn't load your challenges.")}
          action={
            <Button tone="outline" size="sm" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : views.length ? (
        <div className="grid gap-8">
          {sections.map((section) => (
            <section key={section.id} aria-label={section.title || "Challenges"} className="grid gap-3">
              {section.title && (
                <h2 className="type-label flex items-center gap-3 text-mist-500">
                  {section.title}
                  <span className="tabular-nums text-mist-500/60">{section.items.length}</span>
                </h2>
              )}
              {section.items.map(renderTicket)}
            </section>
          ))}
          {respond.isError && (
            <p role="alert" className="text-sm text-danger">
              {getApiErrorMessage(respond.error, "That challenge couldn't be updated.")}
            </p>
          )}
          {query.hasNextPage && (
            <div className="flex justify-center">
              <Button
                tone="outline"
                size="sm"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? "Loading…" : "Show more"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <StatePanel
          icon={scope === "history" ? "clock" : "challenges"}
          title={
            term
              ? "Nothing matches that search"
              : scope === "history"
                ? "No finished challenges yet"
                : scope === "team"
                  ? "No team challenges"
                  : "No open challenges"
          }
          description={
            term
              ? "Try a different player, team or game."
              : scope === "team" && !ownedTeams.length
                ? "Team challenges show up here for teams you own. Start a team to compete as a roster."
                : scope === "history"
                  ? "Played, declined and expired challenges end up here."
                  : "Send one to anyone on Gamerie. They see the game, format and time before they accept."
          }
          action={
            term ? undefined : (
              <Button size="sm" icon="plus" onClick={openComposer}>
                New challenge
              </Button>
            )
          }
        />
      )}

      {composing && (
        <ChallengeComposer
          open
          initialType={composeType}
          initialTarget={presetTarget}
          onClose={closeComposer}
          onCreated={(id) => navigate(`/challenges/${id}`, { replace: true })}
        />
      )}
    </div>
  );
}
