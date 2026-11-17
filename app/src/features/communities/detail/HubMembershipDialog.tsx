import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { slugOf } from "../format";
import { useCommunityInvites, useHubMembershipRequest, useHubRequests, useRespondHubRequest, useRespondInvite } from "../hooks";
import type { HubRequestSummary, HubSummary } from "../types";

export type HubMembershipAction = "hub-invite" | "hub-join-request";

/** Opened from a notification: answer an invitation to this hub, or a player's request to join it. */
export function HubMembershipDialog({
  hub,
  action,
  requestId,
  actorId,
  onClose,
}: {
  hub: HubSummary;
  action: HubMembershipAction;
  requestId?: string;
  actorId?: string;
  onClose: () => void;
}) {
  const invite = action === "hub-invite";
  const exact = useHubMembershipRequest(requestId);
  const invites = useCommunityInvites("hubs", invite && !requestId);
  const requests = useHubRequests(hub.id, !invite && !requestId && Boolean(hub.viewerRelationship?.canManage));
  const respondInvite = useRespondInvite("hub");
  const respondRequest = useRespondHubRequest(hub.id, slugOf(hub));
  const fallback = useMemo<HubRequestSummary | undefined>(() => {
    if (requestId) return undefined;
    if (invite) return invites.data?.find((item) => item.hub?.id === hub.id) as HubRequestSummary | undefined;
    return requests.data?.find((item) => !actorId || item.user?.id === actorId);
  }, [actorId, hub.id, invite, invites.data, requestId, requests.data]);
  const request = exact.data ?? fallback;
  const query = requestId ? exact : invite ? invites : requests;
  const mutation = invite ? respondInvite : respondRequest;
  const pending = request && (request.status === undefined || request.status === "pending");
  const person = request?.user;

  const answer = (accept: boolean) => {
    if (!request) return;
    const options = {
      onSuccess: () => {
        toast.success(invite ? (accept ? `You joined ${hub.name}` : "Invitation declined") : accept ? `${person?.username ?? "They"} joined ${hub.name}` : "Request declined");
        onClose();
      },
      onError: (error: unknown) => toast.error("That didn't go through", getApiErrorMessage(error, "Try again in a moment.")),
    };
    if (invite) respondInvite.mutate({ id: request.id, accept }, options);
    else respondRequest.mutate({ requestId: request.id, accept }, options);
  };

  return (
    <Dialog
      open
      title={invite ? `Invitation to ${hub.name}` : `Request to join ${hub.name}`}
      icon={invite ? "mail" : "follow"}
      onClose={() => !mutation.isPending && onClose()}
      footer={
        pending ? (
          <>
            <Button tone="ghost" size="sm" disabled={mutation.isPending} onClick={() => answer(false)}>
              Decline
            </Button>
            <Button size="sm" icon="check" disabled={mutation.isPending} onClick={() => answer(true)}>
              {invite ? "Join hub" : "Approve"}
            </Button>
          </>
        ) : (
          <Button tone="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {query.isLoading ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : !request ? (
        <p className="text-sm text-mist-400">{query.isError ? getApiErrorMessage(query.error, "This request isn't available anymore.") : "This request isn't available anymore. It may have been answered or cancelled."}</p>
      ) : !pending ? (
        <p className="text-sm text-mist-400">This has already been {request.status === "accepted" ? "accepted" : request.status === "rejected" ? "declined" : request.status}.</p>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/3 p-3.5 ring-1 ring-inset ring-white/6">
            {invite ? (
              <Avatar src={hub.logo} name={hub.name} tone="ink" className="rounded-xl" />
            ) : (
              <Avatar src={person?.profileImage} name={person?.displayName || person?.username || "Player"} className="rounded-full" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{invite ? hub.name : person?.displayName || person?.username || "A player"}</span>
              <span className="block text-xs text-mist-500">
                {invite ? "invited you to join" : "asked to join the hub"}
                {request.createdAt ? ` · ${timeAgo(request.createdAt)}` : ""}
              </span>
            </span>
          </div>
          {request.message && <blockquote className="border-l-2 border-lavender-400/50 pl-3 text-sm leading-relaxed text-mist-200">{request.message}</blockquote>}
        </div>
      )}
    </Dialog>
  );
}
