import { lazy, Suspense } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { HeroBanner } from "@/features/tournaments/components/HeroBanner";
import { cn, titleSize } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { CommunityActions } from "./detail/CommunityActions";
import { HubMembershipDialog, type HubMembershipAction } from "./detail/HubMembershipDialog";
import { CommunityOverview, CommunityPosts, HubMembers, HubTeams, TeamCompetition, TeamFollowers, TeamRoster } from "./detail/CommunityTabs";
import { countOf, hubTypeLabel, type Community } from "./format";
import { useCommunityDetail } from "./hooks";
import { formatMemberRole } from "./options";
import type { CommunityKind, HubSummary, TeamSummary } from "./types";

const CommunityManage = lazy(() => import("./manage/CommunityManage").then((module) => ({ default: module.CommunityManage })));

type Tab = "overview" | "roster" | "members" | "teams" | "competition" | "followers" | "posts" | "manage";

function tabsFor(kind: CommunityKind, item: Community): Array<{ id: Tab; label: string; count?: number }> {
  const manage = item.viewerRelationship?.canManage ? [{ id: "manage" as const, label: "Manage" }] : [];
  if (kind === "team")
    return [
      { id: "overview", label: "Overview" },
      { id: "roster", label: "Roster", count: countOf(item.membersCount, item.members) },
      { id: "competition", label: "Competition" },
      { id: "posts", label: "Posts" },
      { id: "followers", label: "Followers" },
      ...manage,
    ];
  const hub = item as HubSummary;
  return [
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members", count: countOf(hub.membersCount, hub.members) },
    { id: "teams", label: "Teams", count: countOf(hub.teamsCount, hub.teams) },
    { id: "posts", label: "Posts" },
    ...manage,
  ];
}

function Hero({ kind, item }: { kind: CommunityKind; item: Community }) {
  const team = item as TeamSummary;
  const hub = item as HubSummary;
  const relation = item.viewerRelationship;
  const standing = relation?.isOwner
    ? `You own this ${kind}`
    : relation?.isMember
      ? `You're ${formatMemberRole(relation.role, relation.title) === "Member" ? "a member" : `the ${formatMemberRole(relation.role, relation.title).toLowerCase()}`}`
      : null;
  const stats: Array<[string, string]> =
    kind === "team"
      ? [
          ["Members", countOf(item.membersCount, item.members).toLocaleString()],
          ["Followers", countOf(item.followersCount, item.followers).toLocaleString()],
          ["Record", team.stats?.matchesPlayed || team.stats?.wins ? `${team.stats?.wins ?? 0}–${team.stats?.losses ?? 0}` : "No matches"],
          ["Games", String(item.games?.length ?? 0)],
        ]
      : [
          ["Members", countOf(hub.membersCount, hub.members).toLocaleString()],
          ["Teams", countOf(hub.teamsCount, hub.teams).toLocaleString()],
          ["Followers", countOf(item.followersCount, item.followers).toLocaleString()],
          ["Games", String(item.games?.length ?? 0)],
        ];

  return (
    <section className="overflow-hidden rounded-panel bg-ink-900 ring-1 ring-inset ring-white/8">
      <HeroBanner src={item.backgroundImage} game={item.name} className="min-h-56 sm:min-h-72">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-end gap-4 sm:gap-5">
            <Avatar src={item.logo} name={item.name} size="lg" tone="ink" className="shrink-0 rounded-2xl ring-4 ring-ink-900/80 sm:hidden" />
            <Avatar src={item.logo} name={item.name} size="xl" tone="ink" className="hidden shrink-0 rounded-3xl ring-4 ring-ink-900/80 sm:grid" />
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="type-label flex items-center gap-1.5 rounded-full bg-ink-950/60 px-2.5 py-1 text-mist-200 ring-1 ring-inset ring-white/10 backdrop-blur">
                  <Icon name={kind === "team" ? "team" : hub.type === "organization" ? "building" : "hub"} className="size-3" />
                  {kind === "team" ? team.level || "Team" : hubTypeLabel(hub)}
                </span>
                <span className="type-label rounded-full bg-ink-950/60 px-2.5 py-1 text-mist-300 ring-1 ring-inset ring-white/10 backdrop-blur">
                  {item.region || item.country || "Global"}
                </span>
                {kind === "hub" && hub.visibility === "private" && (
                  <span className="type-label flex items-center gap-1 rounded-full bg-ink-950/60 px-2.5 py-1 text-mist-300 ring-1 ring-inset ring-white/10 backdrop-blur">
                    <Icon name="lock" className="size-3" />
                    Private
                  </span>
                )}
              </div>
              <h1 className={cn("type-display mt-3 break-words leading-[0.95]", titleSize(item.name))}>{item.name}</h1>
              {standing && <p className="mt-2 text-sm text-lavender-200">{standing}</p>}
            </div>
          </div>
          <CommunityActions kind={kind} item={item} />
        </div>
      </HeroBanner>
      <dl className="grid grid-cols-2 border-t border-white/6 sm:grid-cols-4">
        {stats.map(([label, value], index) => (
          <div key={label} className={`border-white/6 px-5 py-4 sm:px-6 ${index % 2 ? "border-l" : ""} ${index > 1 ? "border-t sm:border-t-0" : ""} ${index === 2 ? "sm:border-l" : ""}`}>
            <dt className="type-label text-mist-500">{label}</dt>
            <dd className="mt-1.5 font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Restricted({ hub }: { hub: HubSummary }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Hero kind="hub" item={hub} />
      <StatePanel
        icon="lock"
        title="This hub is private"
        description={hub.description || "Its members, teams and posts are visible to members only. Ask to join to see inside."}
      />
    </div>
  );
}

export function CommunityDetailPage({ kind }: { kind: CommunityKind }) {
  const { communitySlug } = useParams();
  const [params, setParams] = useSearchParams();
  const query = useCommunityDetail(kind, communitySlug);
  useDocumentTitle(query.data?.name);
  const back = (
    <Link to={`/${kind}s`} className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-mist-50">
      <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
      {kind === "team" ? "Teams" : "Hubs"}
    </Link>
  );

  if (query.isLoading)
    return (
      <div aria-hidden="true" className="grid gap-6">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-96 rounded-panel" />
        <Skeleton className="h-10 w-96 max-w-full rounded-full" />
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="grid gap-6">
        {back}
        <StatePanel
          icon="warning"
          tone="danger"
          title={`This ${kind} isn't available`}
          description={getApiErrorMessage(query.error, "It may have been removed, or Gamerie couldn't load it right now.")}
          action={
            <div className="flex gap-2">
              <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
                Try again
              </Button>
              <LinkButton to={`/${kind}s`} tone="ghost" size="sm">
                All {kind}s
              </LinkButton>
            </div>
          }
        />
      </div>
    );

  const item = query.data;
  const requestedAction = params.get("membershipAction");
  const membershipAction = kind === "hub" && (requestedAction === "hub-invite" || requestedAction === "hub-join-request") ? (requestedAction as HubMembershipAction) : null;
  const closeMembership = () => {
    const next = new URLSearchParams(params);
    ["membershipAction", "requestId", "actorId"].forEach((name) => next.delete(name));
    setParams(next, { replace: true });
  };
  const membershipDialog = membershipAction && (
    <HubMembershipDialog
      hub={item as HubSummary}
      action={membershipAction}
      requestId={params.get("requestId") || undefined}
      actorId={params.get("actorId") || undefined}
      onClose={closeMembership}
    />
  );

  if (kind === "hub" && (item as HubSummary).restricted)
    return (
      <div className="grid gap-6">
        {back}
        <Restricted hub={item as HubSummary} />
        {membershipDialog}
      </div>
    );

  const tabs = tabsFor(kind, item);
  const requested = params.get("tab") as Tab | null;
  const tab: Tab = tabs.some((entry) => entry.id === requested) ? requested! : "overview";
  const goTab = (next: string) => {
    const nextParams = new URLSearchParams(params);
    if (next === "overview") nextParams.delete("tab");
    else nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {back}
      <Hero kind={kind} item={item} />
      <Tabs label={`${item.name} sections`} indicatorId={`${kind}-detail`} items={tabs} value={tab} onChange={goTab} />
      {tab === "overview" && <CommunityOverview kind={kind} item={item} onTab={goTab} />}
      {tab === "roster" && <TeamRoster team={item as TeamSummary} />}
      {tab === "members" && <HubMembers hub={item as HubSummary} />}
      {tab === "teams" && <HubTeams hub={item as HubSummary} />}
      {tab === "competition" && <TeamCompetition team={item as TeamSummary} />}
      {tab === "followers" && <TeamFollowers team={item as TeamSummary} />}
      {tab === "posts" && <CommunityPosts kind={kind} item={item} />}
      {tab === "manage" && (
        <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
          <CommunityManage kind={kind} item={item} />
        </Suspense>
      )}
      {membershipDialog}
    </div>
  );
}
