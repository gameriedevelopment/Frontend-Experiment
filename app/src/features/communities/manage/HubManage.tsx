import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { ComboboxOption } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { OptionCards } from "@/components/ui/OptionCards";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import { memberName, memberUserId, slugOf } from "../format";
import {
  useCancelHubTeamInvite,
  useCancelHubUserInvite,
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
import { formatMemberRole } from "../options";
import type { CommunityMember, HubSummary, TeamSummary } from "../types";
import { DangerZone, EntityPicker, Empty, RequestRow, Section, fail, userName } from "./ManageParts";

type View = "overview" | "people" | "teams" | "roles" | "access" | "ownership";
const ROLES = ["admin", "manager", "member"];

function Overview({ hub }: { hub: HubSummary }) {
  const dashboard = useHubDashboard(hub.id, true);
  if (dashboard.isLoading) return <Skeleton className="h-80 rounded-card" />;
  if (!dashboard.data) return <Empty>The dashboard isn't available right now.</Empty>;
  const { community, referral, growth } = dashboard.data;
  const link = referral.code ? `${window.location.origin}/register?ref=${encodeURIComponent(referral.code)}` : "";
  const points = growth.memberGrowth.slice(-14);
  const peak = Math.max(1, ...points.map((point) => point.count));
  const funnel: Array<[string, number]> = [
    ["Signed up", referral.totalSignups],
    ["Verified", referral.verifiedUsers],
    ["Completed profile", referral.completedProfiles],
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
      <Section title="Community">
        <dl className="grid grid-cols-2 gap-5">
          {[
            ["Members", community.members],
            ["Teams", community.teams],
            ["Followers", community.followers],
            ["Posts", community.posts],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="type-label text-mist-500">{label}</dt>
              <dd className="type-display mt-2 text-3xl tabular-nums">{Number(value).toLocaleString()}</dd>
            </div>
          ))}
        </dl>
        {points.length > 1 && (
          <div className="mt-6 border-t border-white/6 pt-5">
            <p className="type-label text-mist-500">New members, last {points.length} days</p>
            <div className="mt-3 flex h-20 items-end gap-1">
              {points.map((point, index) => (
                <span
                  key={point.date}
                  title={`${new Date(point.date).toLocaleDateString()}: ${point.count}`}
                  className={index === points.length - 1 ? "flex-1 rounded-t bg-lavender-400" : "flex-1 rounded-t bg-white/10"}
                  style={{ height: `${Math.max(6, (point.count / peak) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </Section>
      <Section title="Referrals" description="Everyone who signs up with the hub's link is credited to the hub.">
        {link ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white/3 p-1.5 pl-4 ring-1 ring-inset ring-white/8">
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-mist-200">{link}</span>
            <Button
              tone="outline"
              size="sm"
              icon="copy"
              onClick={() =>
                navigator.clipboard
                  .writeText(link)
                  .then(() => toast.success("Referral link copied"))
                  .catch(() => toast.error("Couldn't copy the link"))
              }
            >
              Copy
            </Button>
          </div>
        ) : (
          <Empty>The hub doesn't have a referral code yet.</Empty>
        )}
        <ol className="mt-5 grid gap-3">
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

function Roles({ hub }: { hub: HubSummary }) {
  const slug = slugOf(hub);
  const members = useHubMembers(hub.id, "");
  const change = useChangeHubMember(hub.id, slug);
  const remove = useRemoveHubMember(hub.id, slug);
  const [removing, setRemoving] = useState<CommunityMember | null>(null);
  const rows = members.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Section title="Members and roles" description="Admins can manage people, teams and settings. Managers handle requests." meta={members.data?.pages[0]?.total}>
      {members.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <>
          <ul className="grid gap-2">
            {rows.map((member) => {
              const id = memberUserId(member);
              const owner = id === hub.ownerId;
              return (
                <li key={member.id || id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/3 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
                  <Avatar src={member.user?.profileImage} name={memberName(member)} className="rounded-full" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{memberName(member)}</span>
                    <span className="block text-xs text-mist-500">{owner ? "Owner" : formatMemberRole(member.role, member.title)}</span>
                  </span>
                  {!owner && (
                    <span className="flex items-center gap-1">
                      <Menu
                        label={`Role for ${memberName(member)}`}
                        triggerClassName="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-mist-300 ring-1 ring-inset ring-white/10 hover:text-mist-50"
                        trigger={
                          <>
                            {formatMemberRole(member.role)}
                            <Icon name="chevronDown" className="size-3.5 text-mist-500" />
                          </>
                        }
                        items={ROLES.map((role) => ({
                          label: formatMemberRole(role),
                          checked: (member.role || "member") === role,
                          onSelect: () => change.mutate({ userId: id, role, title: member.title || "player" }, { onSuccess: () => toast.success("Role updated"), onError: fail("Couldn't change the role") }),
                        }))}
                      />
                      <Button tone="ghost" size="sm" onClick={() => setRemoving(member)}>
                        Remove
                      </Button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {members.hasNextPage && (
            <Button tone="outline" size="sm" className="mx-auto mt-4 flex" disabled={members.isFetchingNextPage} onClick={() => void members.fetchNextPage()}>
              Show more
            </Button>
          )}
        </>
      )}
      <ConfirmDialog
        open={Boolean(removing)}
        title={`Remove ${removing ? memberName(removing) : ""}?`}
        description="They leave the hub and its members-only posts."
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
