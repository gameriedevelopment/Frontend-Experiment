import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EntrantLink } from "@/components/ui/EntrantLink";
import type { ComboboxOption } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { inputClasses } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { playerPath } from "@/lib/paths";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useManageView } from "@/lib/useManageView";
import { memberName, memberUserId, slugOf } from "../format";
import {
  useCancelTeamInvite,
  useChangeTeamMember,
  useCommunityDirectory,
  useCreateTeamHubRequest,
  useInviteTeamMember,
  useRemoveTeamMember,
  useRespondTeamHubInvite,
  useRespondTeamRequest,
  useTeamHubInvites,
  useTeamPendingInvites,
  useTeamReferralCode,
  useTeamRequests,
} from "../hooks";
import { formatMemberRole } from "../options";
import type { CommunityMember, HubSummary, TeamSummary } from "../types";
import { DangerZone, EntityPicker, Empty, ReferralLink, RequestRow, Section, fail, userName } from "./ManageParts";
import { TeamWallet } from "./TeamWallet";

const TITLES = ["manager", "leader", "vice leader", "coach", "analyst", "scouter", "partner", "member"];
type View = "people" | "roster" | "hubs" | "wallet" | "ownership";

function TeamReferral({ teamId }: { teamId: string }) {
  const referral = useTeamReferralCode(teamId);
  return (
    <Section title="Referral link" description="People who sign up through this link follow your team and the hubs it belongs to.">
      {referral.data ? (
        <ReferralLink code={referral.data} />
      ) : (
        <Button tone="outline" size="sm" icon="link" disabled={referral.isPending} onClick={() => referral.mutate(undefined, { onError: fail("Couldn't get the referral link") })}>
          {referral.isPending ? "Getting link…" : "Get referral link"}
        </Button>
      )}
    </Section>
  );
}

function People({ team }: { team: TeamSummary }) {
  const slug = slugOf(team);
  const requests = useTeamRequests(team.id, true);
  const invites = useTeamPendingInvites(team.id, true);
  const invite = useInviteTeamMember(team.id, slug);
  const respond = useRespondTeamRequest(team.id, slug);
  const cancel = useCancelTeamInvite(team.id, slug);
  const [target, setTarget] = useState<ComboboxOption | null>(null);
  const incoming = (requests.data ?? []).filter((request) => request.direction !== "invite");

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Section title="Invite a player" description="They get a notification and can accept from the Teams page.">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <EntityPicker id="team-invite" kind="players" label="Player" value={target} onChange={setTarget} />
          <Button
            icon="mail"
            className="h-12"
            disabled={!target || invite.isPending}
            onClick={() =>
              target &&
              invite.mutate(target.label, {
                onSuccess: () => {
                  toast.success("Invitation sent", target.label);
                  setTarget(null);
                },
                onError: fail("Couldn't send the invitation"),
              })
            }
          >
            Invite
          </Button>
        </div>
      </Section>
      <TeamReferral key={team.id} teamId={team.id} />
      <Section title="Asking to join" meta={incoming.length}>
        {requests.isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : incoming.length ? (
          <ul className="grid gap-2">
            {incoming.map((request) => (
              <RequestRow key={request.id} name={userName(request.user)} image={request.user?.profileImage} detail={request.message || request.user?.gamerTitle} at={request.createdAt}>
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
          <Empty>No one is waiting. Share the team page so players can ask to join.</Empty>
        )}
      </Section>
      <Section title="Invited" meta={invites.data?.length}>
        {invites.isLoading ? (
          <Skeleton className="h-16 rounded-2xl" />
        ) : invites.data?.length ? (
          <ul className="grid gap-2">
            {invites.data.map((pending) => (
              <RequestRow key={pending.id} name={userName(pending.user)} image={pending.user?.profileImage} detail="Invitation sent" at={pending.createdAt}>
                <Button
                  tone="ghost"
                  size="sm"
                  disabled={cancel.isPending}
                  onClick={() => pending.user?.id && cancel.mutate(pending.user.id, { onSuccess: () => toast.info("Invitation cancelled"), onError: fail("Couldn't cancel") })}
                >
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

function Roster({ team }: { team: TeamSummary }) {
  const slug = slugOf(team);
  const change = useChangeTeamMember(team.id, slug);
  const remove = useRemoveTeamMember(team.id, slug);
  const [removing, setRemoving] = useState<CommunityMember | null>(null);
  const members = (team.members ?? []).filter((member) => member.isActive !== false);

  return (
    <Section title="Roster" description="Titles show on the roster and in team chat. Removing a player takes them off the team." meta={members.length}>
      <ul className="grid gap-2">
        {members.map((member) => {
          const id = memberUserId(member);
          const owner = id === team.ownerId;
          return (
            <li key={member.id || id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/3 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
              <EntrantLink to={playerPath(member.user?.username || id)} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar src={member.user?.profileImage} name={memberName(member)} className="rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{memberName(member)}</span>
                  <span className="block text-xs text-mist-500">{owner ? "Owner" : formatMemberRole(member.role, member.title)}</span>
                </span>
              </EntrantLink>
              {!owner && (
                <span className="flex items-center gap-1">
                  <Menu
                    label={`Title for ${memberName(member)}`}
                    triggerClassName="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-mist-300 ring-1 ring-inset ring-white/10 hover:text-mist-50"
                    trigger={
                      <>
                        {formatMemberRole(undefined, member.title)}
                        <Icon name="chevronDown" className="size-3.5 text-mist-500" />
                      </>
                    }
                    items={TITLES.map((title) => ({
                      label: formatMemberRole(undefined, title),
                      checked: (member.title || "member") === title,
                      onSelect: () =>
                        change.mutate({ userId: id, role: "member", title }, { onSuccess: () => toast.success("Title updated", `${memberName(member)} is now ${title}.`), onError: fail("Couldn't change the title") }),
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
      <ConfirmDialog
        open={Boolean(removing)}
        title={`Remove ${removing ? memberName(removing) : ""}?`}
        description="They come off the roster and lose access to team chat. Past results stay on the record."
        confirmLabel="Remove"
        icon="minus"
        pending={remove.isPending}
        onConfirm={() =>
          removing &&
          remove.mutate(memberUserId(removing), {
            onSuccess: () => {
              toast.info(`${memberName(removing)} was removed`);
              setRemoving(null);
            },
            onError: fail("Couldn't remove the player"),
          })
        }
        onClose={() => setRemoving(null)}
      />
    </Section>
  );
}

function Hubs({ team }: { team: TeamSummary }) {
  const slug = slugOf(team);
  const invites = useTeamHubInvites(team.id, true);
  const respond = useRespondTeamHubInvite(team.id, slug);
  const request = useCreateTeamHubRequest(team.id, slug);
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim(), 350);
  const results = useCommunityDirectory("hubs", { search: term }, term.length > 1);
  const joined = new Set((team.hubs ?? []).map((hub) => hub.id));
  const hubs = ((results.data?.pages.flatMap((page) => page.items) ?? []) as HubSummary[]).filter((hub) => !joined.has(hub.id)).slice(0, 6);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Section title="Hub invitations" meta={invites.data?.length}>
        {invites.isLoading ? (
          <Skeleton className="h-16 rounded-2xl" />
        ) : invites.data?.length ? (
          <ul className="grid gap-2">
            {invites.data.map((entry) => (
              <RequestRow key={entry.id} square name={entry.hub?.name ?? "A hub"} image={entry.hub?.logo} detail={entry.message || "Invited your team to join"} at={entry.createdAt}>
                <Button tone="ghost" size="sm" disabled={respond.isPending} onClick={() => respond.mutate({ requestId: entry.id, accept: false }, { onSuccess: () => toast.info("Invitation declined"), onError: fail("Couldn't decline") })}>
                  Decline
                </Button>
                <Button size="sm" disabled={respond.isPending} onClick={() => respond.mutate({ requestId: entry.id, accept: true }, { onSuccess: () => toast.success(`${team.name} joined ${entry.hub?.name ?? "the hub"}`), onError: fail("Couldn't accept") })}>
                  Accept
                </Button>
              </RequestRow>
            ))}
          </ul>
        ) : (
          <Empty>No hub has invited the team.</Empty>
        )}
      </Section>
      <Section title="Join a hub" description="Find a community or organisation and ask for your whole team to join.">
        <label className="relative block">
          <span className="sr-only">Search hubs</span>
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search hubs" className={cn(inputClasses, "h-11 rounded-full pl-11")} />
        </label>
        {term.length > 1 && (
          <ul className="mt-4 grid gap-2">
            {results.isLoading ? (
              <Skeleton className="h-16 rounded-2xl" />
            ) : hubs.length ? (
              hubs.map((hub) => (
                <RequestRow key={hub.id} square name={hub.name} image={hub.logo} detail={[hub.region, hub.joinPolicy === "open" ? "Open to join" : "By request"].filter(Boolean).join(" · ")}>
                  <Button
                    tone="outline"
                    size="sm"
                    disabled={request.isPending}
                    onClick={() => request.mutate({ hubId: hub.id }, { onSuccess: () => toast.success("Request sent", `${hub.name} will review it.`), onError: fail("Couldn't send the request") })}
                  >
                    Ask to join
                  </Button>
                </RequestRow>
              ))
            ) : (
              <Empty>No hubs match.</Empty>
            )}
          </ul>
        )}
      </Section>
    </div>
  );
}

export function TeamManage({ team }: { team: TeamSummary }) {
  const owner = Boolean(team.viewerRelationship?.isOwner);
  const options: Array<{ value: View; label: string }> = [
    { value: "people", label: "People" },
    { value: "roster", label: "Roster" },
    { value: "hubs", label: "Hubs" },
    { value: "wallet", label: "Wallet" },
    ...(owner ? [{ value: "ownership" as const, label: "Ownership" }] : []),
  ];
  const [view, setView] = useManageView(options.map((item) => item.value), "people", { access: "people", requests: "people" });
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Segmented label="Team tools" value={view} onChange={setView} options={options} className="relative w-fit max-w-full overflow-x-auto scrollbar-none" />
      {view === "people" && <People team={team} />}
      {view === "roster" && <Roster team={team} />}
      {view === "hubs" && <Hubs team={team} />}
      {view === "wallet" && <TeamWallet team={team} />}
      {view === "ownership" && <DangerZone kind="team" item={team} />}
    </div>
  );
}
