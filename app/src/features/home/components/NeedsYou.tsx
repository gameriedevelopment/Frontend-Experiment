import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Challenge } from "@/features/challenges/types";
import { useRespondInvite } from "@/features/communities/hooks";
import type { CommunityInvite, CommunityKind, HubSummary, TeamSummary } from "@/features/communities/types";
import { toast } from "@/lib/toast";
import { formatWhen } from "../format";
import { HomePanel } from "./HomePanel";

export interface PendingInvite {
  kind: CommunityKind;
  invite: CommunityInvite<TeamSummary | HubSummary>;
}

function challengeHeadline(challenge: Challenge) {
  if (challenge.type === "team") {
    return `${challenge.challengerTeamName || "A team"} challenged ${challenge.challengedTeamName || "your team"}`;
  }
  return `${challenge.challengerName || "A player"} challenged you`;
}

function ChallengeRow({ challenge }: { challenge: Challenge }) {
  const detail = [challenge.game, challenge.format, challenge.scheduledDate ? formatWhen(challenge.scheduledDate) : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <li>
      <Link
        to={`/challenges/${challenge.id}`}
        className="group flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-white/3"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-lavender-400/14 text-lavender-300">
          <Icon name="challenges" weight="duotone" className="size-[1.15rem]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold sm:truncate">{challengeHeadline(challenge)}</span>
          <span className="mt-0.5 block truncate text-sm text-mist-400">{detail}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-lavender-300 group-hover:text-lavender-200">
          <span className="sr-only sm:not-sr-only">Review</span>
          <Icon name="arrowRight" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </li>
  );
}

function InviteRow({ kind, invite }: PendingInvite) {
  const respond = useRespondInvite(kind);
  const community = kind === "team" ? invite.team : invite.hub;
  const name = community?.name || (kind === "team" ? "A team" : "A hub");
  const href = community ? `/${kind}s/${encodeURIComponent(community.slug || community.id)}` : `/${kind}s`;

  return (
    <li className="flex flex-col gap-3 rounded-2xl px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      <Link to={href} className="flex min-w-0 flex-1 items-center gap-4">
        <Avatar src={community?.logo} name={name} size="md" tone="ink" className="rounded-full" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold sm:truncate">
            {name} invited you to join {kind === "team" ? "the team" : "the hub"}
          </span>
          <span className="mt-0.5 block truncate text-sm text-mist-400">
            {invite.message || (kind === "team" ? "Team invite" : "Hub invite")}
          </span>
        </span>
      </Link>
      <div className="flex shrink-0 gap-2 pl-14 sm:pl-0">
        <Button
          size="sm"
          tone="ghost"
          disabled={respond.isPending}
          onClick={() =>
            respond.mutate({ id: invite.id, accept: false }, { onSuccess: () => toast.info("Invite declined") })
          }
        >
          Decline
        </Button>
        <Button
          size="sm"
          disabled={respond.isPending}
          onClick={() =>
            respond.mutate(
              { id: invite.id, accept: true },
              { onSuccess: () => toast.success(`You joined ${name}`, kind === "team" ? "It's on your teams list." : undefined) },
            )
          }
        >
          Accept
        </Button>
      </div>
      {respond.isError && (
        <p role="alert" className="text-sm text-danger sm:basis-full sm:pl-14">
          That didn't go through. Try again.
        </p>
      )}
    </li>
  );
}

export function NeedsYou({
  challenges,
  invites,
  className,
}: {
  challenges: Challenge[];
  invites: PendingInvite[];
  className?: string;
}) {
  const count = challenges.length + invites.length;
  if (!count) return null;
  return (
    <HomePanel
      className={className}
      title="Needs you"
      description="Challenges and invites waiting for your answer."
      link={challenges.length ? { label: "All challenges", to: "/challenges" } : undefined}
    >
      <ul className="-mx-3 -my-1 flex flex-col gap-1">
        {challenges.map((challenge) => (
          <ChallengeRow key={challenge.id} challenge={challenge} />
        ))}
        {invites.map((item) => (
          <InviteRow key={`${item.kind}-${item.invite.id}`} {...item} />
        ))}
      </ul>
    </HomePanel>
  );
}
