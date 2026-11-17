import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { useAuthStore } from "@/features/auth/authStore";
import { GameFilter } from "@/features/games/components/GameFilter";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { CommunityCard } from "./components/CommunityCard";
import { hrefOf, memberUserId, type Community } from "./format";
import { useCommunityDirectory, useCommunityInvites, useRespondInvite, useUserHubs, useUserTeams } from "./hooks";
import { COMMUNITY_REGIONS, TEAM_LEVELS, formatMemberRole } from "./options";
import type { CommunityKind, CommunityInvite, HubSummary, TeamSummary } from "./types";

type View = "discover" | "mine";

const copy = {
  team: {
    title: "Teams",
    description: "Rosters that play together: challenges, tournaments and ladders as one side, with a shared record.",
    create: "Start a team",
    empty: "No teams match yet",
    mine: "Teams you're on",
  },
  hub: {
    title: "Hubs",
    description: "Homes for communities and organisations, where players and whole teams gather around a game or a place.",
    create: "Start a hub",
    empty: "No hubs match yet",
    mine: "Hubs you're in",
  },
} as const;

function GridSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-72 rounded-card" />
      ))}
    </div>
  );
}

function Invites({ kind }: { kind: CommunityKind }) {
  const query = useCommunityInvites(`${kind}s`);
  const respond = useRespondInvite(kind);
  const invites = (query.data ?? []) as Array<CommunityInvite<TeamSummary | HubSummary>>;
  if (!invites.length) return null;
  return (
    <section aria-label="Invitations" className="grid gap-2">
      {invites.map((invite) => {
        const item = invite.team ?? invite.hub;
        if (!item) return null;
        const answer = (accept: boolean) =>
          respond.mutate(
            { id: invite.id, accept },
            {
              onSuccess: () => (accept ? toast.success(`You joined ${item.name}`) : toast.info("Invitation declined")),
              onError: (error) => toast.error("Couldn't answer the invitation", getApiErrorMessage(error, "Try again in a moment.")),
            },
          );
        return (
          <article key={invite.id} className="flex flex-wrap items-center gap-4 rounded-card bg-lavender-400/6 p-4 ring-1 ring-inset ring-lavender-400/30 sm:px-5">
            <Link to={hrefOf(kind, item)} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar src={item.logo} name={item.name} tone="ink" className="rounded-xl" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{item.name} invited you</span>
                <span className="block truncate text-sm text-mist-400">{invite.message || `Join the ${kind} to play and post with them.`}</span>
              </span>
            </Link>
            <span className="flex gap-2">
              <Button tone="ghost" size="sm" disabled={respond.isPending} onClick={() => answer(false)}>
                Decline
              </Button>
              <Button size="sm" disabled={respond.isPending} onClick={() => answer(true)}>
                Accept
              </Button>
            </span>
          </article>
        );
      })}
    </section>
  );
}

function Mine({ kind }: { kind: CommunityKind }) {
  const user = useAuthStore((state) => state.user);
  const teams = useUserTeams(user?.id, kind === "team");
  const hubs = useUserHubs(user?.id, kind === "hub");
  const query = kind === "team" ? teams : hubs;
  const items = (query.data ?? []) as Community[];

  if (query.isLoading) return <GridSkeleton />;
  if (query.isError)
    return <StatePanel icon="warning" tone="danger" title="This list didn't load" description={getApiErrorMessage(query.error, "Try again in a moment.")} />;
  if (!items.length)
    return (
      <StatePanel
        icon={kind}
        title={kind === "team" ? "You're not on a team yet" : "You're not in a hub yet"}
        description={kind === "team" ? "Find a roster that fits, or start your own and invite players." : "Join a community around your game or region, or start one."}
        action={
          <LinkButton to={`/${kind}s/create`} size="sm" icon="plus">
            {copy[kind].create}
          </LinkButton>
        }
      />
    );

  const roleOf = (item: Community) => {
    if (item.ownerId === user?.id) return "Owner";
    const member = item.members?.find((entry) => memberUserId(entry) === user?.id);
    return formatMemberRole(member?.role ?? (item as TeamSummary).role, member?.title ?? (item as TeamSummary).title);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <CommunityCard key={item.id} kind={kind} item={item} role={roleOf(item)} />
      ))}
    </div>
  );
}

function Discover({ kind }: { kind: CommunityKind }) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const term = useDebouncedValue(search.trim(), 350);
  const level = params.get("level") ?? "";
  const type = params.get("type") ?? "";
  const region = params.get("region") ?? "";
  const game = params.get("game") ?? "";
  const filters = useMemo(
    () => ({ search: term || undefined, level: level || undefined, type: type || undefined, region: region || undefined, game: game || undefined }),
    [term, level, type, region, game],
  );
  const query = useCommunityDirectory(`${kind}s`, filters);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const filtered = Boolean(term || level || type || region || game);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    // Mirror the debounced search into the URL so a search survives reloads and sharing.
    if ((params.get("q") ?? "") !== term) setParam("q", term);
  }, [term]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 basis-64">
          <span className="sr-only">Search {kind}s</span>
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${kind}s by name or description`} className={cn(inputClasses, "h-11 rounded-full pl-11")} />
        </label>
        {kind === "team" ? (
          <FilterMenu label="Level" value={level} options={TEAM_LEVELS} onChange={(value) => setParam("level", value)} />
        ) : (
          <FilterMenu
            label="Type"
            value={type}
            options={[
              { value: "community", label: "Community" },
              { value: "organization", label: "Organization" },
            ]}
            onChange={(value) => setParam("type", value)}
          />
        )}
        <GameFilter value={game} onChange={(value) => setParam("game", value)} />
        <FilterMenu label="Region" value={region} options={COMMUNITY_REGIONS} onChange={(value) => setParam("region", value)} />
      </div>

      {query.isLoading ? (
        <GridSkeleton />
      ) : query.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title={`${copy[kind].title} didn't load`}
          description={getApiErrorMessage(query.error, "Try again in a moment.")}
          action={
            <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      ) : items.length ? (
        <>
          {filtered && (
            <p className="text-sm text-mist-500">
              {total.toLocaleString()} {total === 1 ? `${kind} matches` : `${kind}s match`}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <CommunityCard key={item.id} kind={kind} item={item} />
            ))}
          </div>
          {query.hasNextPage && (
            <Button tone="outline" size="sm" className="mx-auto" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
              {query.isFetchingNextPage ? "Loading…" : "Show more"}
            </Button>
          )}
        </>
      ) : (
        <StatePanel
          icon={kind}
          title={copy[kind].empty}
          description={filtered ? "Try another search or clear a filter." : `Be the first: start a ${kind} and invite people.`}
          action={
            filtered ? (
              <Button
                tone="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setParams({}, { replace: true });
                }}
              >
                Clear filters
              </Button>
            ) : (
              <LinkButton to={`/${kind}s/create`} size="sm" icon="plus">
                {copy[kind].create}
              </LinkButton>
            )
          }
        />
      )}
    </div>
  );
}

export function CommunityDirectoryPage({ kind }: { kind: CommunityKind }) {
  const [params, setParams] = useSearchParams();
  const view: View = params.get("view") === "mine" ? "mine" : "discover";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        title={copy[kind].title}
        description={copy[kind].description}
        actions={
          <LinkButton to={`/${kind}s/create`} icon="plus" orb>
            {copy[kind].create}
          </LinkButton>
        }
      />
      <Invites kind={kind} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <Tabs
          label={copy[kind].title}
          indicatorId={`${kind}-directory`}
          items={[
            { id: "discover", label: "Discover" },
            { id: "mine", label: copy[kind].mine },
          ]}
          value={view}
          onChange={(value) => setParams(value === "mine" ? { view: "mine" } : {}, { replace: true })}
        />
        {view === "mine" ? <Mine kind={kind} /> : <Discover kind={kind} />}
      </div>
    </div>
  );
}
