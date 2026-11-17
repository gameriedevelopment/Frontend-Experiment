import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/Field";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { useAuthStore } from "@/features/auth/authStore";
import { useCreateConversation } from "@/features/messages/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { slugOf, type Community } from "../format";
import { useCommunityFollow, useCommunityJoin, useCommunityLeave, useCommunityReport } from "../hooks";
import type { CommunityKind, HubSummary, TeamSummary } from "../types";

const reportReasons = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Something else" },
];

const fail = (title: string) => (error: unknown) => toast.error(title, getApiErrorMessage(error, "Try again in a moment."));

export function CommunityActions({ kind, item }: { kind: CommunityKind; item: Community }) {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const slug = slugOf(item);
  const relation = item.viewerRelationship;
  const hub = item as HubSummary;
  const openHub = kind === "hub" && hub.joinPolicy === "open" && hub.visibility !== "private";
  const follow = useCommunityFollow(kind, slug, item.id, Boolean(relation?.isFollowing));
  const join = useCommunityJoin(kind, slug, item.id);
  const leave = useCommunityLeave(kind, slug, item.id);
  const report = useCommunityReport(kind, item.id, item.ownerId || item.id);
  const conversation = useCreateConversation();
  const [dialog, setDialog] = useState<"join" | "leave" | "report" | null>(null);
  const [message, setMessage] = useState("");
  const [reportType, setReportType] = useState("spam");
  const [reason, setReason] = useState("");

  const messageTeam = async () => {
    if (!user) return;
    const team = item as TeamSummary;
    const participantIds = relation?.isMember
      ? Array.from(
          new Set([
            user.id,
            ...(team.members ?? []).filter((member) => member.isActive !== false).map((member) => member.user?.id || member.userId || ""),
          ]),
        ).filter(Boolean)
      : [user.id];
    try {
      const result = await conversation.mutateAsync(
        relation?.isMember
          ? { participantIds, type: "team", teamId: item.id, name: item.name, avatar: item.logo }
          : { participantIds, type: "team-inbox", teamId: item.id, name: item.name, avatar: item.logo },
      );
      navigate(`/messages?conversation=${result.id}&tab=team`);
    } catch (error) {
      fail("Couldn't open the conversation")(error);
    }
  };

  const copyLink = () =>
    navigator.clipboard
      .writeText(`${window.location.origin}/${kind}s/${encodeURIComponent(slug)}`)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Couldn't copy the link"));

  const menu: MenuItem[] = [
    ...(relation?.isOwner ? [{ label: `Edit ${kind}`, icon: "edit" as const, onSelect: () => navigate(`/${kind}s/${encodeURIComponent(slug)}/edit`) }] : []),
    ...(kind === "team" && !relation?.isMember
      ? [
          {
            label: "Challenge team",
            icon: "challenges" as const,
            onSelect: () => navigate(`/challenges/new?type=team&target=${encodeURIComponent(item.id)}&targetName=${encodeURIComponent(item.name)}`),
          },
          { label: "Message team", icon: "mail" as const, onSelect: () => void messageTeam() },
        ]
      : []),
    { label: "Copy link", icon: "copy", onSelect: () => void copyLink() },
    ...(relation?.isMember && !relation.isOwner ? [{ label: `Leave ${kind}`, icon: "signOut" as const, danger: true, onSelect: () => setDialog("leave") }] : []),
    ...(!relation?.isMember ? [{ label: `Report ${kind}`, icon: "flag" as const, danger: true, onSelect: () => setDialog("report") }] : []),
  ];

  const primary = (() => {
    if (relation?.isMember) {
      return kind === "team" ? (
        <Button size="sm" icon="mail" disabled={conversation.isPending} onClick={() => void messageTeam()}>
          {conversation.isPending ? "Opening…" : "Team chat"}
        </Button>
      ) : null;
    }
    if (relation?.hasPendingRequest)
      return (
        <Button tone="outline" size="sm" icon="hourglass" disabled className="bg-ink-950/50 backdrop-blur">
          Request sent
        </Button>
      );
    return (
      <Button
        size="sm"
        icon="follow"
        disabled={join.isPending}
        onClick={() =>
          openHub
            ? join.mutate("", { onSuccess: () => toast.success(`Welcome to ${item.name}`), onError: fail("Couldn't join") })
            : setDialog("join")
        }
      >
        {openHub ? "Join hub" : "Ask to join"}
      </Button>
    );
  })();

  return (
    <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:flex-nowrap">
      {primary}
      {!relation?.isOwner && (
        <Button
          tone="outline"
          size="sm"
          icon={relation?.isFollowing ? "check" : undefined}
          className="bg-ink-950/50 backdrop-blur"
          disabled={follow.isPending}
          onClick={() =>
            follow.mutate(undefined, {
              onSuccess: () => toast.info(relation?.isFollowing ? `Unfollowed ${item.name}` : `Following ${item.name}`),
              onError: fail("Couldn't update follow"),
            })
          }
        >
          {relation?.isFollowing ? "Following" : "Follow"}
        </Button>
      )}
      <div className="rounded-full bg-ink-950/50 ring-1 ring-inset ring-white/12 backdrop-blur">
        <Menu label={`More ${kind} actions`} items={menu} />
      </div>

      {dialog === "join" && (
        <Dialog
          open
          title={`Ask to join ${item.name}`}
          description={kind === "team" ? "The owner and admins see your request. Say what you play and when you're free." : "The hub's admins review requests."}
          icon="follow"
          onClose={() => setDialog(null)}
          dismissible={!join.isPending}
          footer={
            <>
              <Button tone="ghost" size="sm" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                icon="send"
                disabled={join.isPending}
                onClick={() =>
                  join.mutate(message.trim(), {
                    onSuccess: () => {
                      setDialog(null);
                      setMessage("");
                      toast.success("Request sent", "You'll hear back in your notifications.");
                    },
                  })
                }
              >
                {join.isPending ? "Sending…" : "Send request"}
              </Button>
            </>
          }
        >
          <div className="grid gap-3">
            <TextAreaField id="join-message" label="Message (optional)" maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} />
            {join.isError && (
              <p role="alert" className="text-sm text-danger">
                {getApiErrorMessage(join.error, "Your request wasn't sent.")}
              </p>
            )}
          </div>
        </Dialog>
      )}

      <ConfirmDialog
        open={dialog === "leave"}
        title={`Leave ${item.name}?`}
        description={kind === "team" ? "You come off the roster. You can ask to rejoin later." : "You leave the hub and its members-only posts."}
        confirmLabel={`Leave ${kind}`}
        icon="signOut"
        pending={leave.isPending}
        error={leave.isError ? getApiErrorMessage(leave.error, "You couldn't leave right now.") : undefined}
        onConfirm={() =>
          leave.mutate(undefined, {
            onSuccess: () => {
              setDialog(null);
              toast.info(`You left ${item.name}`);
            },
          })
        }
        onClose={() => setDialog(null)}
      />

      {dialog === "report" && (
        <Dialog
          open
          title={`Report ${item.name}`}
          description="Reports are private. Gamerie reviews them and acts on anything that breaks the rules."
          icon="flag"
          tone="danger"
          onClose={() => setDialog(null)}
          dismissible={!report.isPending}
          footer={
            <>
              <Button tone="ghost" size="sm" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={report.isPending}
                onClick={() =>
                  report.mutate(
                    { type: reportType, reason: reason.trim() || reportReasons.find((entry) => entry.value === reportType)!.label },
                    {
                      onSuccess: () => {
                        setDialog(null);
                        setReason("");
                        toast.success("Report sent", "Thanks for keeping Gamerie safe.");
                      },
                    },
                  )
                }
              >
                {report.isPending ? "Sending…" : "Send report"}
              </Button>
            </>
          }
        >
          <div className="grid gap-5">
            <ChoiceGroup legend="What's wrong?" columns={2}>
              {reportReasons.map((entry) => (
                <ChoiceChip key={entry.value} name="community-report" value={entry.value} checked={reportType === entry.value} onChange={() => setReportType(entry.value)} label={entry.label} />
              ))}
            </ChoiceGroup>
            <TextAreaField id="community-report-details" label="Details (optional)" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
            {report.isError && (
              <p role="alert" className="text-sm text-danger">
                {getApiErrorMessage(report.error, "The report wasn't sent.")}
              </p>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
