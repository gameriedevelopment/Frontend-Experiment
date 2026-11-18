import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { EntrantLink } from "@/components/ui/EntrantLink";
import type { ComboboxOption } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputClasses } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { OptionCards } from "@/components/ui/OptionCards";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { playerPath } from "@/lib/paths";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { memberName, memberUserId, slugOf } from "../format";
import {
  useCancelHubTeamInvite,
  useCancelHubUserInvite,
  useChangeHubDesignation,
  useChangeHubMember,
  useHubDashboard,
  useHubMembers,
  useHubPendingInvites,
  useHubRequests,
  useHubTeamRequests,
  useInviteHubMember,
  useInviteTeamToHub,
  useRemoveHubMember,
  useRemoveHubTeam,
  useRespondHubRequest,
  useRespondHubTeamRequest,
  useUpdateHubPolicy,
} from "../hooks";
import { DESIGNATION_LABELS, HUB_ROLE_GROUPS, hubMemberRoles } from "../hubRoles";
import type { CommunityMember, HubDesignation, HubMemberFilter, HubSummary, TeamSummary } from "../types";
import { HubReport } from "./HubReport";
import { DangerZone, EntityPicker, Empty, ReferralLink, RequestRow, Section, fail, userName } from "./ManageParts";

type View = "overview" | "people" | "teams" | "roles" | "access" | "ownership";

function Overview({ hub }: { hub: HubSummary }) {
  const dashboard = useHubDashboard(hub.id, true);
  if (dashboard.isLoading) return <Skeleton className="h-[36rem] rounded-card" />;
  if (!dashboard.data) return <Empty>The dashboard isn't available right now.</Empty>;
  const { referral } = dashboard.data;
  const funnel: Array<[string, number]> = [
    ["Signed up", referral.totalSignups],
    ["Verified", referral.verifiedUsers],
    ["Completed profile", referral.completedProfiles],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <HubReport
        hub={hub}
        data={dashboard.data}
        actions={
          <LinkButton to={`/hubs/${encodeURIComponent(slugOf(hub))}/report`} target="_blank" tone="outline" size="sm" icon="printer">
            Sponsor report
          </LinkButton>
        }
      />
      <Section title="Referrals" description="Everyone who signs up with the hub's link is credited to the hub.">
        {referral.code ? (
          <ReferralLink code={referral.code} />
        ) : (
          <Empty>The hub doesn't have a referral code yet.</Empty>
        )}
        <ol className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-6">
          {funnel.map(([label, value]) => (
            <li key={label}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-mist-300">{label}</span>
                <span className="font-semibold tabular-nums">{value.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/6">
                <div className="h-full rounded-full bg-lavender-400/80" style={{ width: `${referral.totalSignups ? Math.max(2, (value / referral.totalSignups) * 100) : 0}%` }} />
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}

function People({ hub }: { hub: HubSummary }) {
  const slug = slugOf(hub);
  const requests = useHubRequests(hub.id, true);
  const pending = useHubPendingInvites(hub.id, true);
  const invite = useInviteHubMember(hub.id, slug);
  const respond = useRespondHubRequest(hub.id, slug);
  const cancel = useCancelHubUserInvite(hub.id, slug);
  const [target, setTarget] = useState<ComboboxOption | null>(null);
  const incoming = (requests.data ?? []).filter((request) => request.direction !== "invite");

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Section title="Invite a player">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <EntityPicker id="hub-invite-player" kind="players" label="Player" value={target} onChange={setTarget} />
          <Button
            icon="mail"
            className="h-12"
            disabled={!target || invite.isPending}
            onClick={() =>
              target &&
              invite.mutate({ userId: target.value }, { onSuccess: () => (toast.success("Invitation sent", target.label), setTarget(null)), onError: fail("Couldn't send the invitation") })
            }
          >
            Invite
          </Button>
        </div>
      </Section>
      <Section title="Asking to join" meta={incoming.length}>
        {requests.isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : incoming.length ? (
          <ul className="grid gap-2">
            {incoming.map((request) => (
              <RequestRow key={request.id} name={userName(request.user)} image={request.user?.profileImage} detail={request.message} at={request.createdAt}>
                <Button tone="ghost" size="sm" disabled={respond.isPending} onClick={() => respond.mutate({ requestId: request.id, accept: false }, { onSuccess: () => toast.info("Request declined"), onError: fail("Couldn't decline") })}>
                  Decline
                </Button>
                <Button size="sm" disabled={respond.isPending} onClick={() => respond.mutate({ requestId: request.id, accept: true }, { onSuccess: () => toast.success(`${userName(request.user)} joined`), onError: fail("Couldn't accept") })}>
                  Accept
                </Button>
              </RequestRow>
            ))}
          </ul>
        ) : (
          <Empty>No one is waiting.</Empty>
        )}
      </Section>
      <Section title="Invited players" meta={pending.data?.users.length}>
        {pending.data?.users.length ? (
          <ul className="grid gap-2">
            {pending.data.users.map((entry) => (
              <RequestRow key={entry.id} name={userName(entry.user)} image={entry.user?.profileImage} detail="Invitation sent" at={entry.createdAt}>
                <Button tone="ghost" size="sm" disabled={cancel.isPending} onClick={() => entry.user?.id && cancel.mutate(entry.user.id, { onSuccess: () => toast.info("Invitation cancelled"), onError: fail("Couldn't cancel") })}>
                  Cancel
                </Button>
              </RequestRow>
            ))}
          </ul>
        ) : (
          <Empty>No open invitations.</Empty>
        )}
      </Section>
    </div>
  );
}

function Teams({ hub }: { hub: HubSummary }) {
  const slug = slugOf(hub);
  const requests = useHubTeamRequests(hub.id, true);
  const pending = useHubPendingInvites(hub.id, true);
  const invite = useInviteTeamToHub(hub.id, slug);
  const respond = useRespondHubTeamRequest(hub.id, slug);
  const cancel = useCancelHubTeamInvite(hub.id, slug);
  const removeTeam = useRemoveHubTeam(hub.id, slug);
  const [target, setTarget] = useState<ComboboxOption | null>(null);
  const [removing, setRemoving] = useState<TeamSummary | null>(null);
  const incoming = (requests.data ?? []).filter((request) => request.direction !== "invite");

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Section title="Invite a team" description="The team's owner accepts on the team's behalf.">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <EntityPicker id="hub-invite-team" kind="teams" label="Team" value={target} onChange={setTarget} />
          <Button
            icon="mail"
            className="h-12"
            disabled={!target || invite.isPending}
            onClick={() => target && invite.mutate({ teamId: target.value }, { onSuccess: () => (toast.success("Invitation sent", target.label), setTarget(null)), onError: fail("Couldn't send the invitation") })}
          >
            Invite
          </Button>
        </div>
      </Section>
      <Section title="Teams asking to join" meta={incoming.length}>
        {requests.isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : incoming.length ? (
          <ul className="grid gap-2">
            {incoming.map((request) => (
              <RequestRow key={request.id} square name={request.team?.name ?? "A team"} image={request.team?.logo} detail={request.message || (request.requestedBy ? `by ${userName(request.requestedBy)}` : undefined)} at={request.createdAt}>
                <Button tone="ghost" size="sm" disabled={respond.isPending} onClick={() => respond.mutate({ requestId: request.id, accept: false }, { onSuccess: () => toast.info("Request declined"), onError: fail("Couldn't decline") })}>
                  Decline
                </Button>
                <Button size="sm" disabled={respond.isPending} onClick={() => respond.mutate({ requestId: request.id, accept: true }, { onSuccess: () => toast.success(`${request.team?.name ?? "The team"} joined`), onError: fail("Couldn't accept") })}>
                  Accept
                </Button>
              </RequestRow>
            ))}
          </ul>
        ) : (
          <Empty>No team is waiting.</Empty>
        )}
      </Section>
      {(pending.data?.teams.length ?? 0) > 0 && (
        <Section title="Invited teams" meta={pending.data!.teams.length}>
          <ul className="grid gap-2">
            {pending.data!.teams.map((entry) => (
              <RequestRow key={entry.id} square name={entry.team?.name ?? "A team"} image={entry.team?.logo} detail="Invitation sent" at={entry.createdAt}>
                <Button tone="ghost" size="sm" disabled={cancel.isPending} onClick={() => entry.team?.id && cancel.mutate(entry.team.id, { onSuccess: () => toast.info("Invitation cancelled"), onError: fail("Couldn't cancel") })}>
                  Cancel
                </Button>
              </RequestRow>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Teams in the hub" meta={hub.teams?.length}>
        {hub.teams?.length ? (
          <ul className="grid gap-2">
            {hub.teams.map((team) => (
              <RequestRow key={team.id} square name={team.name} image={team.logo} detail={[team.region, team.level].filter(Boolean).join(" · ")}>
                <Button tone="ghost" size="sm" onClick={() => setRemoving(team)}>
                  Remove
                </Button>
              </RequestRow>
            ))}
          </ul>
        ) : (
          <Empty>No teams yet.</Empty>
        )}
      </Section>
      <ConfirmDialog
        open={Boolean(removing)}
        title={`Remove ${removing?.name}?`}
        description="The team leaves the hub. Its players stay members unless you remove them too."
        confirmLabel="Remove team"
        pending={removeTeam.isPending}
        onConfirm={() => removing && removeTeam.mutate(removing.id, { onSuccess: () => (toast.info(`${removing.name} was removed`), setRemoving(null)), onError: fail("Couldn't remove the team") })}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}

const ACCESS_ROLES: Array<{ value: string; label: string }> = [
  { value: "admin", label: "Co-owner" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "No management access" },
];
const chip = "type-label rounded-full bg-white/6 px-2 py-0.5 text-mist-200";
const pill = "flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-mist-300 ring-1 ring-inset ring-white/10 hover:text-mist-50";

function Roles({ hub }: { hub: HubSummary }) {
  const slug = slugOf(hub);
  const relationship = hub.viewerRelationship;
  const canAssign = Boolean(relationship?.isOwner) || relationship?.role === "owner" || relationship?.role === "admin";
  const [filter, setFilter] = useState<HubMemberFilter | undefined>();
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim(), 350);
  const dashboard = useHubDashboard(hub.id, true);
  const members = useHubMembers(hub.id, term, true, filter);
  const change = useChangeHubMember(hub.id, slug);
  const designate = useChangeHubDesignation(hub.id, slug);
  const remove = useRemoveHubMember(hub.id, slug);
  const [removing, setRemoving] = useState<CommunityMember | null>(null);
  const rows = members.data?.pages.flatMap((page) => page.items) ?? [];
  const summary = dashboard.data?.roles;
  const groups = [
    { filter: undefined, label: "Everyone", description: "Every member of the hub", count: summary?.total ?? members.data?.pages[0]?.total },
    ...HUB_ROLE_GROUPS.map((group) => ({ ...group, count: summary ? group.count(summary) : undefined })),
  ];

  return (
    <Section
      title="Members and roles"
      description="Give people a role that says how they belong. Team roles follow each player's team automatically, and leaving the team removes it."
      meta={members.data?.pages[0]?.total}
    >
      <div role="group" aria-label="Filter members by role" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {groups.map((group) => {
          const attention = group.filter === "unassigned" && Boolean(group.count);
          return (
            <button
              key={group.label}
              type="button"
              title={group.description}
              aria-pressed={filter === group.filter}
              onClick={() => setFilter(group.filter)}
              className={cn(
                "grid gap-1 rounded-2xl px-3.5 py-3 text-left ring-1 ring-inset transition-colors",
                filter === group.filter ? "bg-lavender-400/12 ring-lavender-400/40" : "bg-white/3 ring-white/6 hover:bg-white/5",
              )}
            >
              <span className={cn("type-display text-xl tabular-nums", attention && "text-signal")}>{group.count?.toLocaleString() ?? "–"}</span>
              <span className="text-xs text-mist-400">{group.label}</span>
            </button>
          );
        })}
      </div>
      {filter === "unassigned" && (
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-signal/8 px-4 py-3 text-sm text-mist-200 ring-1 ring-inset ring-signal/20">
          <Icon name="info" className="mt-0.5 size-4 text-signal" />
          These members have no role. Keep them as hub members, give them a role, or remove them from the hub.
        </p>
      )}
      <label className="relative mt-4 block">
        <span className="sr-only">Search members</span>
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members by username" className={cn(inputClasses, "h-11 rounded-full pl-11")} />
      </label>

      <div className="mt-4">
        {members.isLoading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : members.isError ? (
          <p className="text-sm text-danger">{getApiErrorMessage(members.error, "Members didn't load.")}</p>
        ) : rows.length ? (
          <>
            <ul className="grid gap-2">
              {rows.map((member) => {
                const id = memberUserId(member);
                const owner = member.role === "owner" || id === hub.ownerId;
                const protectedAdmin = !relationship?.isOwner && relationship?.role === "admin" && member.role === "admin";
                return (
                  <li key={member.id || id} className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-2xl bg-white/3 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
                    <Avatar src={member.user?.profileImage} name={memberName(member)} className="rounded-full" />
                    <span className="min-w-0 flex-1">
                      <EntrantLink to={playerPath(member.user?.username || id)} className="block truncate text-sm font-semibold">
                        {memberName(member)}
                      </EntrantLink>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {hubMemberRoles(member, hub.ownerId).map((label) => (
                          <span key={label} className={cn(chip, "max-w-full truncate", label === "Hub member" && "bg-white/4 text-mist-500")}>
                            {label}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span className="flex w-full flex-wrap items-center gap-1 sm:w-auto">
                      {canAssign && id && (
                        <Menu
                          label={`Hub role for ${memberName(member)}`}
                          triggerClassName={pill}
                          trigger={
                            <>
                              {member.designation ? DESIGNATION_LABELS[member.designation] : "Assign role"}
                              <Icon name="chevronDown" className="size-3.5 text-mist-500" />
                            </>
                          }
                          items={[null, ...(Object.keys(DESIGNATION_LABELS) as HubDesignation[])].map((designation) => ({
                            label: designation ? DESIGNATION_LABELS[designation] : "No hub role",
                            checked: (member.designation ?? null) === designation,
                            onSelect: () =>
                              designate.mutate({ userId: id, designation }, { onSuccess: () => toast.success("Hub role updated"), onError: fail("Couldn't change the hub role") }),
                          }))}
                        />
                      )}
                      {owner ? (
                        <span className="flex h-9 items-center gap-1.5 px-2 text-sm text-lavender-300">
                          <Icon name="crown" className="size-4" />
                          Owner
                        </span>
                      ) : protectedAdmin ? (
                        <span className="px-2 text-xs text-mist-500">Managed by the owner</span>
                      ) : (
                        <>
                          <Menu
                            label={`Access for ${memberName(member)}`}
                            triggerClassName={pill}
                            trigger={
                              <>
                                Access
                                <Icon name="chevronDown" className="size-3.5 text-mist-500" />
                              </>
                            }
                            items={ACCESS_ROLES.map((role) => ({
                              label: role.label,
                              checked: (member.role || "member") === role.value,
                              onSelect: () =>
                                change.mutate({ userId: id, role: role.value, title: member.title || "player" }, { onSuccess: () => toast.success("Access updated"), onError: fail("Couldn't change access") }),
                            }))}
                          />
                          <Button tone="ghost" size="sm" onClick={() => setRemoving(member)}>
                            Remove
                          </Button>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            {members.hasNextPage && (
              <Button tone="outline" size="sm" className="mx-auto mt-4 flex" disabled={members.isFetchingNextPage} onClick={() => void members.fetchNextPage()}>
                {members.isFetchingNextPage ? "Loading…" : "Show more"}
              </Button>
            )}
          </>
        ) : (
          <Empty>
            {term
              ? `No one in this hub has a username containing “${term}”.`
              : filter === "unassigned"
                ? "Every member of this hub has a role."
                : filter
                  ? "No members hold a role in this group yet."
                  : "Members appear here after joining or accepting an invitation."}
          </Empty>
        )}
      </div>
      <ConfirmDialog
        open={Boolean(removing)}
        title={`Remove ${removing ? memberName(removing) : ""}?`}
        description="They leave the hub and its members-only posts. If they're on one of the hub's teams, they stay on that team."
        confirmLabel="Remove"
        pending={remove.isPending}
        onConfirm={() => removing && remove.mutate(memberUserId(removing), { onSuccess: () => (toast.info(`${memberName(removing)} was removed`), setRemoving(null)), onError: fail("Couldn't remove the member") })}
        onClose={() => setRemoving(null)}
      />
    </Section>
  );
}

function Access({ hub }: { hub: HubSummary }) {
  const update = useUpdateHubPolicy(hub.id, slugOf(hub));
  const [visibility, setVisibility] = useState(hub.visibility === "private" ? "private" : "public");
  const [joinPolicy, setJoinPolicy] = useState(hub.joinPolicy === "open" ? "open" : "request");
  const changed = visibility !== (hub.visibility === "private" ? "private" : "public") || joinPolicy !== (hub.joinPolicy === "open" ? "open" : "request");

  return (
    <Section title="Access" description="Who can see inside the hub, and how people get in.">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <OptionCards
          legend="Visibility"
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: "public", label: "Public", description: "Anyone can see members, teams and posts.", icon: "globe" },
            { value: "private", label: "Private", description: "Only members see inside. Others see the name and description.", icon: "lock" },
          ]}
        />
        <OptionCards
          legend="Joining"
          value={joinPolicy}
          onChange={setJoinPolicy}
          options={[
            { value: "open", label: "Open", description: "Players join in one tap.", icon: "follow" },
            { value: "request", label: "By request", description: "Admins and managers approve each request.", icon: "hourglass" },
          ]}
        />
        <div className="flex justify-end">
          <Button
            icon="check"
            disabled={!changed || update.isPending}
            onClick={() => update.mutate({ visibility, joinPolicy }, { onSuccess: () => toast.success("Access updated"), onError: fail("Couldn't update access") })}
          >
            {update.isPending ? "Saving…" : "Save access"}
          </Button>
        </div>
      </div>
    </Section>
  );
}

export function HubManage({ hub }: { hub: HubSummary }) {
  const owner = Boolean(hub.viewerRelationship?.isOwner);
  const [view, setView] = useState<View>("overview");
  const options: Array<{ value: View; label: string }> = [
    { value: "overview", label: "Overview" },
    { value: "people", label: "People" },
    { value: "teams", label: "Teams" },
    { value: "roles", label: "Roles" },
    { value: "access", label: "Access" },
    ...(owner ? [{ value: "ownership" as const, label: "Ownership" }] : []),
  ];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Segmented label="Hub tools" value={view} onChange={setView} options={options} className="relative w-fit max-w-full overflow-x-auto scrollbar-none" />
      {view === "overview" && <Overview hub={hub} />}
      {view === "people" && <People hub={hub} />}
      {view === "teams" && <Teams hub={hub} />}
      {view === "roles" && <Roles hub={hub} />}
      {view === "access" && <Access hub={hub} />}
      {view === "ownership" && <DangerZone kind="hub" item={hub} />}
    </div>
  );
}
