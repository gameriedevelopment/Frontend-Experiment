import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { useAuthStore } from "@/features/auth/authStore";
import { PostCard } from "@/features/feed/components/PostCard";
import { PostComposer } from "@/features/feed/components/PostComposer";
import { PostSkeleton } from "@/features/feed/components/PostSkeleton";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { CommunityCard } from "../components/CommunityCard";
import { countOf, hrefOf, hubTypeLabel, memberName, memberUserId, type Community } from "../format";
import { useCommunityPosts, useHubMembers, useTeamFollowers, useTeamGameRanks } from "../hooks";
import { formatMemberRole } from "../options";
import type { CommunityKind, CommunityMember, CompetitionItem, HubSummary, TeamSummary } from "../types";

export function Panel({ title, meta, children, className }: { title: string; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6", className)}>
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {meta && <div className="text-sm text-mist-400">{meta}</div>}
      </header>
      {children}
    </section>
  );
}

const joinedOn = (value?: string) => (value ? new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(value)) : null);

function rankWeight(member: CommunityMember, ownerId?: string) {
  if (memberUserId(member) === ownerId) return 0;
  const role = (member.role || "").toLowerCase();
  return role === "admin" || role === "co-owner" ? 1 : role === "captain" || role === "manager" ? 2 : 3;
}

export function MemberRow({ member, ownerId, actions }: { member: CommunityMember; ownerId?: string; actions?: ReactNode }) {
  const owner = memberUserId(member) === ownerId;
  const role = owner ? "Owner" : formatMemberRole(member.role, member.title);
  const joined = joinedOn(member.joinedAt);
  const username = member.user?.username;
  return (
    <li className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-white/3">
      <Link to={username ? `/profile/${encodeURIComponent(username)}` : "#"} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={member.user?.profileImage} name={memberName(member)} online={member.user?.isOnline} className="rounded-full" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{memberName(member)}</span>
          <span className="block truncate text-xs text-mist-500">
            {[member.title && member.title.toLowerCase() !== role.toLowerCase() ? member.title : null, member.user?.gamerTitle, joined ? `since ${joined}` : null]
              .filter(Boolean)
              .join(" · ") || "Member"}
          </span>
        </span>
      </Link>
      <span className={cn("type-label shrink-0 rounded-full px-2.5 py-1", owner ? "bg-lavender-400/14 text-lavender-300" : role === "Member" ? "bg-white/5 text-mist-400" : "bg-white/8 text-mist-200")}>
        {role}
      </span>
      {actions}
    </li>
  );
}

function sortedMembers(item: Community) {
  return [...(item.members ?? [])].filter((member) => member.isActive !== false).sort((a, b) => rankWeight(a, item.ownerId) - rankWeight(b, item.ownerId));
}

function Fact({ icon, label, value }: { icon: IconName; label: string; value?: ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon name={icon} className="mt-0.5 size-4 shrink-0 text-mist-500" />
      <dt className="sr-only">{label}</dt>
      <dd className="min-w-0 text-sm text-mist-200">{value}</dd>
    </div>
  );
}

function RecentPosts({ kind, item, onSeeAll }: { kind: CommunityKind; item: Community; onSeeAll: () => void }) {
  const query = useCommunityPosts(kind, item.id, true);
  const posts = (query.data ?? []).slice(0, 2);
  const member = Boolean(item.viewerRelationship?.isMember);
  return (
    <section className="grid gap-3">
      <header className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Latest posts</h2>
        {posts.length > 0 && (
          <button type="button" onClick={onSeeAll} className="flex items-center gap-1 text-sm font-medium text-lavender-300 hover:text-lavender-200">
            All posts
            <Icon name="arrowRight" className="size-3.5" />
          </button>
        )}
      </header>
      {query.isLoading ? (
        <PostSkeleton count={1} media={false} />
      ) : posts.length ? (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <div className="flex flex-wrap items-center gap-4 rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-mist-400">
            <Icon name="feed" className="size-[1.1rem]" />
          </span>
          <p className="min-w-0 flex-1 text-sm text-mist-400">
            {member ? `Nothing posted yet. Share scrim times, results or news with everyone who follows ${item.name}.` : `${item.name} hasn't posted yet. Follow to see their updates in your feed.`}
          </p>
          {member && (
            <Button tone="outline" size="sm" icon="edit" onClick={onSeeAll}>
              Write a post
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

function RosterGrid({ team, onSeeAll }: { team: TeamSummary; onSeeAll: () => void }) {
  const members = sortedMembers(team);
  return (
    <Panel
      title="Roster"
      meta={
        members.length > 6 ? (
          <button type="button" onClick={onSeeAll} className="font-medium text-lavender-300 hover:text-lavender-200">
            All {members.length}
          </button>
        ) : (
          `${members.length} ${members.length === 1 ? "player" : "players"}`
        )
      }
    >
      {members.length ? (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {members.slice(0, 6).map((member) => {
            const owner = memberUserId(member) === team.ownerId;
            const role = owner ? "Owner" : formatMemberRole(member.role, member.title);
            const username = member.user?.username;
            return (
              <li key={member.id || memberUserId(member)}>
                <Link
                  to={username ? `/profile/${encodeURIComponent(username)}` : "#"}
                  className="group flex items-center gap-3 rounded-2xl bg-white/3 p-3 ring-1 ring-inset ring-white/6 transition-colors hover:bg-white/5 hover:ring-lavender-400/30"
                >
                  <Avatar src={member.user?.profileImage} name={memberName(member)} online={member.user?.isOnline} className="rounded-full" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold group-hover:text-lavender-100">{memberName(member)}</span>
                    <span className={cn("block truncate text-xs", owner ? "text-lavender-300" : "text-mist-500")}>{role}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-mist-500">No one on the roster yet.</p>
      )}
    </Panel>
  );
}

function HubTeamsPreview({ hub, onSeeAll, onManage }: { hub: HubSummary; onSeeAll: () => void; onManage: () => void }) {
  const teams = hub.teams ?? [];
  return (
    <Panel
      title="Teams"
      meta={
        teams.length > 4 ? (
          <button type="button" onClick={onSeeAll} className="font-medium text-lavender-300 hover:text-lavender-200">
            All {teams.length}
          </button>
        ) : undefined
      }
    >
      {teams.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {teams.slice(0, 4).map((team) => (
            <li key={team.id}>
              <Link to={hrefOf("team", team)} className="group flex items-center gap-3 rounded-2xl bg-white/3 p-3 ring-1 ring-inset ring-white/6 transition-colors hover:bg-white/5 hover:ring-lavender-400/30">
                <Avatar src={team.logo} name={team.name} tone="ink" className="rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold group-hover:text-lavender-100">{team.name}</span>
                  <span className="block truncate text-xs text-mist-500">{[team.level, `${countOf(team.membersCount, team.members)} members`].filter(Boolean).join(" · ")}</span>
                </span>
                <Icon name="arrowRight" className="size-3.5 text-mist-500 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="min-w-0 flex-1 text-sm text-mist-400">No teams have joined yet. Teams bring their whole roster into the hub.</p>
          {hub.viewerRelationship?.canManage && (
            <Button tone="outline" size="sm" icon="mail" onClick={onManage}>
              Invite a team
            </Button>
          )}
        </div>
      )}
    </Panel>
  );
}

function RecordPanel({ team }: { team: TeamSummary }) {
  const member = Boolean(team.viewerRelationship?.isMember);
  const played = team.stats?.matchesPlayed ?? (team.stats?.wins ?? 0) + (team.stats?.losses ?? 0);
  if (!played)
    return (
      <Panel title="Record">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-mist-400">
            <Icon name="challenges" className="size-[1.1rem]" />
          </span>
          <p className="min-w-0 flex-1 text-sm text-mist-400">
            No recorded matches yet. Challenges, tournaments and ladder results build the team's record here.
          </p>
          <LinkButton
            tone="outline"
            size="sm"
            icon="challenges"
            to={member ? "/challenges/new?type=team" : `/challenges/new?type=team&target=${encodeURIComponent(team.id)}&targetName=${encodeURIComponent(team.name)}`}
          >
            {member ? "Find a match" : `Challenge ${team.name}`}
          </LinkButton>
        </div>
      </Panel>
    );
  return (
    <Panel title="Record">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Played", played],
          ["Won", team.stats?.wins ?? 0],
          ["Win rate", team.stats?.winRate != null ? `${Math.round(team.stats.winRate)}%` : "—"],
          ["Titles", team.stats?.tournamentWins ?? 0],
        ].map(([label, value]) => (
          <div key={label as string}>
            <dt className="type-label text-mist-500">{label}</dt>
            <dd className={cn("type-display mt-2 text-2xl tabular-nums", label === "Titles" && Number(value) > 0 && "text-signal")}>{value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function CommunityOverview({ kind, item, onTab }: { kind: CommunityKind; item: Community; onTab: (tab: string) => void }) {
  const team = item as TeamSummary;
  const hub = item as HubSummary;
  const members = sortedMembers(item);
  const total = countOf(item.membersCount, item.members);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <Panel title={kind === "team" ? "About the team" : "About this hub"}>
          <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-mist-200">
            {item.description || (kind === "team" ? "This team hasn't written an introduction yet." : "This hub hasn't written an introduction yet.")}
          </p>
          {team.teamMessage && <blockquote className="mt-5 border-l-2 border-lavender-400/50 pl-4 text-sm leading-relaxed text-mist-300">{team.teamMessage}</blockquote>}
          {item.games?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {item.games.map((game) => (
                <span key={game.id || game.name} className="flex items-center gap-2 rounded-full bg-white/5 py-1.5 pl-2.5 pr-3 text-sm text-mist-200 ring-1 ring-inset ring-white/8">
                  <Icon name="games" className="size-4 text-lavender-300" />
                  {game.name}
                  {game.platforms?.length ? <span className="text-xs text-mist-500">{game.platforms.join(" · ")}</span> : null}
                </span>
              ))}
            </div>
          ) : null}
        </Panel>
        {kind === "team" ? <RosterGrid team={team} onSeeAll={() => onTab("roster")} /> : <HubTeamsPreview hub={hub} onSeeAll={() => onTab("teams")} onManage={() => onTab("manage")} />}
        {kind === "team" && <RecordPanel team={team} />}
        <RecentPosts kind={kind} item={item} onSeeAll={() => onTab("posts")} />
      </div>

      <aside className="grid gap-6">
        <Panel title="Details">
          <dl className="-my-2.5 divide-y divide-white/5">
            <Fact icon="mapPin" label="Region" value={[item.region, item.country].filter(Boolean).join(" · ") || "Global"} />
            <Fact icon="clock" label="Time zone" value={item.timezone?.replace(/_/g, " ")} />
            <Fact icon="games" label="Platforms" value={item.platforms?.join(" · ")} />
            {kind === "team" ? (
              <Fact icon="trophy" label="Level" value={team.level} />
            ) : (
              <>
                <Fact icon={hub.type === "organization" ? "building" : "people"} label="Type" value={hub.organizationName ? `${hubTypeLabel(hub)} · ${hub.organizationName}` : hubTypeLabel(hub)} />
                <Fact
                  icon={hub.visibility === "private" ? "lock" : "globe"}
                  label="Access"
                  value={`${hub.visibility === "private" ? "Private" : "Public"} · ${hub.joinPolicy === "open" ? "anyone can join" : "join by request"}`}
                />
              </>
            )}
          </dl>
        </Panel>
        {kind === "hub" && (
          <Panel
            title="People"
            meta={
              <button type="button" onClick={() => onTab("members")} className="font-medium text-lavender-300 hover:text-lavender-200">
                {total.toLocaleString()} {total === 1 ? "member" : "members"}
              </button>
            }
          >
            {members.length ? (
              <ul className="-mx-2 grid">
                {members.slice(0, 5).map((member) => (
                  <MemberRow key={member.id || memberUserId(member)} member={member} ownerId={item.ownerId} />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mist-500">No members listed yet.</p>
            )}
          </Panel>
        )}
        {kind === "team" && (team.hubs?.length ?? 0) > 0 && (
          <Panel title="Hubs">
            <ul className="-mx-2 grid">
              {team.hubs!.slice(0, 5).map((entry) => (
                <li key={entry.id}>
                  <Link to={hrefOf("hub", entry)} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-white/3">
                    <Avatar src={entry.logo} name={entry.name} tone="ink" className="rounded-xl" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{entry.name}</span>
                    <Icon name="arrowRight" className="size-3.5 text-mist-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </aside>
    </div>
  );
}

export function TeamRoster({ team }: { team: TeamSummary }) {
  const members = sortedMembers(team);
  if (!members.length) return <StatePanel icon="people" title="No one on the roster yet" description="Members show here with their roles once they join." />;
  return (
    <Panel title="Roster" meta={`${members.length} ${members.length === 1 ? "player" : "players"}`}>
      <ul className="-mx-2 grid sm:grid-cols-2 sm:gap-x-4">
        {members.map((member) => (
          <MemberRow key={member.id || memberUserId(member)} member={member} ownerId={team.ownerId} />
        ))}
      </ul>
    </Panel>
  );
}

export function HubMembers({ hub }: { hub: HubSummary }) {
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim(), 350);
  const query = useHubMembers(hub.id, term);
  const members = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  return (
    <Panel title="Members" meta={query.data ? `${total.toLocaleString()} ${total === 1 ? "person" : "people"}` : undefined}>
      <label className="relative mb-4 block">
        <span className="sr-only">Search members</span>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members" className={cn(inputClasses, "h-11 rounded-full pl-11")} />
      </label>
      {query.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : query.isError ? (
        <p className="text-sm text-danger">{getApiErrorMessage(query.error, "Members didn't load.")}</p>
      ) : members.length ? (
        <>
          <ul className="-mx-2 grid sm:grid-cols-2 sm:gap-x-4">
            {members.map((member) => (
              <MemberRow key={member.id || memberUserId(member)} member={member} ownerId={hub.ownerId} />
            ))}
          </ul>
          {query.hasNextPage && (
            <Button tone="outline" size="sm" className="mx-auto mt-4 flex" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
              {query.isFetchingNextPage ? "Loading…" : "Show more"}
            </Button>
          )}
        </>
      ) : (
        <p className="text-sm text-mist-500">{term ? "No one matches that search." : "No members yet."}</p>
      )}
    </Panel>
  );
}

export function HubTeams({ hub }: { hub: HubSummary }) {
  const teams = hub.teams ?? [];
  if (!teams.length) return <StatePanel icon="team" title="No teams here yet" description="Teams that join this hub show up here, with their rosters." />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {teams.map((team) => (
        <CommunityCard key={team.id} kind="team" item={team} />
      ))}
    </div>
  );
}

function CompetitionList({ title, items, empty }: { title: string; items?: CompetitionItem[]; empty: string }) {
  return (
    <Panel title={title} meta={items?.length ? items.length : undefined}>
      {items?.length ? (
        <ol className="grid">
          {items.map((entry, index) => (
            <li key={entry.id ?? index} className="flex items-baseline justify-between gap-4 border-t border-white/5 py-2.5 first:border-t-0 first:pt-0">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{entry.name || entry.title}</span>
                {entry.description && <span className="block truncate text-xs text-mist-500">{entry.description}</span>}
              </span>
              <span className="shrink-0 text-xs text-mist-500">{joinedOn(entry.date || entry.createdAt) ?? entry.status}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-mist-500">{empty}</p>
      )}
    </Panel>
  );
}

export function TeamCompetition({ team }: { team: TeamSummary }) {
  const ranks = useTeamGameRanks(team.id, true);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2 lg:items-start">
      <Panel title="Game rankings">
        {ranks.isLoading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : ranks.data?.length ? (
          <ul className="grid">
            {ranks.data.map((rank, index) => {
              const game = typeof rank.game === "string" ? rank.game : rank.game?.name;
              const tier = [rank.rankData?.tier, rank.rankData?.division].filter(Boolean).join(" ");
              return (
                <li key={rank.id ?? index} className="flex items-center gap-3 border-t border-white/5 py-3 first:border-t-0 first:pt-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lavender-400/10 text-lavender-300">
                    <Icon name="games" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{game}</span>
                    {tier && <span className="block text-xs text-mist-500">{tier}</span>}
                  </span>
                  {rank.rank != null && <span className="type-display text-xl tabular-nums">#{rank.rank}</span>}
                  {rank.rankingScore != null && <span className="text-xs tabular-nums text-mist-500">{Math.round(rank.rankingScore)} pts</span>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-mist-500">Rankings appear once the team plays recorded matches.</p>
        )}
      </Panel>
      <CompetitionList title="Tournaments" items={team.tournaments} empty="No tournament runs recorded yet." />
      <CompetitionList title="Achievements" items={team.achievements} empty="Achievements show here as the team earns them." />
      <CompetitionList title="Milestones" items={team.milestones} empty="No milestones yet." />
    </div>
  );
}

export function TeamFollowers({ team }: { team: TeamSummary }) {
  const query = useTeamFollowers(team.id, true);
  const followers = query.data?.pages.flatMap((page) => page.items) ?? [];
  if (query.isLoading) return <Skeleton className="h-64 rounded-card" />;
  if (!followers.length) return <StatePanel icon="follow" title="No followers yet" description="Players who follow the team see its posts and results in their feed." />;
  return (
    <Panel title="Followers" meta={query.data?.pages[0]?.total.toLocaleString()}>
      <ul className="-mx-2 grid sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-3">
        {followers.map((follower) => (
          <li key={follower.id}>
            <Link to={follower.username ? `/profile/${encodeURIComponent(follower.username)}` : "#"} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-white/3">
              <Avatar src={follower.profileImage} name={follower.displayName || follower.username} online={follower.isOnline} className="rounded-full" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{follower.displayName || follower.username}</span>
                {follower.gamerTitle && <span className="block truncate text-xs text-mist-500">{follower.gamerTitle}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {query.hasNextPage && (
        <Button tone="outline" size="sm" className="mx-auto mt-4 flex" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>
          {query.isFetchingNextPage ? "Loading…" : "Show more"}
        </Button>
      )}
    </Panel>
  );
}

export function CommunityPosts({ kind, item }: { kind: CommunityKind; item: Community }) {
  const user = useAuthStore((state) => state.user);
  const query = useCommunityPosts(kind, item.id, true);
  const relation = item.viewerRelationship;
  const canPost = Boolean(user?.id && relation?.isMember);
  const posts = query.data ?? [];

  return (
    <div className="mx-auto grid w-full max-w-2xl grid-cols-[minmax(0,1fr)] gap-4">
      {canPost && (
        <PostComposer
          community={{ kind, id: item.id, name: item.name, canAnnounce: Boolean(relation?.canManage || relation?.isOwner) }}
          placeholder={kind === "team" ? "Share a result, a scrim time or team news" : `Post to ${item.name}`}
        />
      )}
      {query.isLoading ? (
        <PostSkeleton count={2} />
      ) : query.isError ? (
        <StatePanel icon="warning" tone="danger" title="Posts didn't load" description={getApiErrorMessage(query.error, "Try again in a moment.")} />
      ) : posts.length ? (
        posts.map((post) => <PostCard key={post.id} post={post} canDeleteOverride={Boolean(relation?.canManage)} />)
      ) : (
        <StatePanel
          icon="feed"
          title="No posts yet"
          description={canPost ? "Start the conversation: results, scrim times, clips." : `Posts from ${item.name} show up here.`}
        />
      )}
    </div>
  );
}
