import { useState } from "react";
import { Facts } from "@/components/record/Facts";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Button, LinkButton } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { formatDateTime, statusLabel } from "@/lib/format";
import {
  inviteAdministrator,
  removeAdministrator,
  resendAdministratorInvite,
  revokeAdministratorInvite,
  updateAdministrator,
} from "../api";
import type { Administrator, AdministratorInvite } from "../types";

export type AdministratorDesk =
  | { kind: "invite" }
  | { kind: "member" | "change-status" | "remove"; member: Administrator }
  | { kind: "invitation" | "resend" | "revoke"; invite: AdministratorInvite };

export const memberName = (member: Administrator) => member.username || member.email;
export const accessLevel = (member: Administrator) =>
  member.isProtected ? "Protected super admin" : member.isSuperAdmin ? "Super admin" : "Administrator";

function InviteDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (message: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  return (
    <ReasonDialog title="Invite an administrator" description="The single-use invitation link expires in seven days."
      confirmLabel="Send invitation" icon="mail" tone="brand" askReason={false} onClose={onClose}
      validate={() => {
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
        setError(valid ? undefined : "Enter a valid email address.");
        return valid;
      }}
      onConfirm={async () => {
        await inviteAdministrator(email.trim());
        onSaved("Invitation sent");
      }}
    >
      <TextField id="administrator-email" label="Email address" type="email" maxLength={254} autoComplete="email"
        value={email} error={error} onChange={(event) => { setEmail(event.target.value); setError(undefined); }}
      />
    </ReasonDialog>
  );
}

export function AdministratorDialogs({ desk, actorId, onChange, onClose, onSaved }: {
  desk: AdministratorDesk;
  actorId: string;
  onChange: (desk: AdministratorDesk) => void;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  if (desk.kind === "invite") return <InviteDialog onClose={onClose} onSaved={onSaved} />;

  if ("member" in desk) {
    const member = desk.member;
    const name = memberName(member);
    const canChange = !member.isProtected && !member.isSuperAdmin && member.userId !== actorId;
    const suspend = member.status === "active";

    if (desk.kind === "member" || !canChange) return (
      <Dialog open title={name} description={member.username ? member.email : undefined} icon="operator" onClose={onClose}
        footer={
          <>
            <LinkButton to={`/users/${member.userId}`} tone="ghost" size="sm">Open user</LinkButton>
            {canChange && (
              <>
                <Button tone="outline" size="sm" className="text-danger" onClick={() => onChange({ kind: "remove", member })}>Remove access</Button>
                <Button size="sm" onClick={() => onChange({ kind: "change-status", member })}>{suspend ? "Suspend" : "Reactivate"}</Button>
              </>
            )}
          </>
        }
      >
        <Facts className="[&_dd]:whitespace-normal [&_dd]:wrap-anywhere" items={[
          ["Access", statusLabel(member.status)],
          ["Role", accessLevel(member)],
          ["Invited by", member.invitedByEmail],
          ["Last admin activity", formatDateTime(member.lastActiveAt)],
          ["Last sign-in", formatDateTime(member.lastLogin)],
          ["Added", formatDateTime(member.createdAt)],
        ]} />
      </Dialog>
    );

    const remove = desk.kind === "remove";
    const label = suspend ? "Suspend" : "Reactivate";
    return (
      <ReasonDialog title={remove ? `Remove access for ${name}?` : `${label} ${name}?`}
        description={remove ? "Their Gamerie account stays. They will need a new invitation for admin access." : suspend ? "This stops their access to the admin console." : "This restores their access to the admin console."}
        confirmLabel={remove ? "Remove access" : label} icon={remove ? "trash" : "operator"}
        tone={remove || suspend ? "danger" : "brand"} onClose={onClose}
        onConfirm={async (reason) => {
          if (remove) await removeAdministrator(member.id, reason);
          else await updateAdministrator(member.id, suspend ? "suspended" : "active", reason);
          onSaved(remove ? "Administrator access removed" : suspend ? "Administrator suspended" : "Administrator reactivated");
        }}
      />
    );
  }

  const invite = desk.invite;
  const open = invite.status === "pending" || invite.status === "expired";
  if (desk.kind === "invitation" || !open) return (
    <Dialog open title={invite.email} icon="mail" onClose={onClose}
      footer={open && (
        <>
          {invite.status === "pending" && (
            <Button tone="outline" size="sm" className="text-danger" onClick={() => onChange({ kind: "revoke", invite })}>Revoke invitation</Button>
          )}
          <Button size="sm" onClick={() => onChange({ kind: "resend", invite })}>{invite.status === "expired" ? "Send a new link" : "Resend invitation"}</Button>
        </>
      )}
    >
      <Facts className="[&_dd]:whitespace-normal [&_dd]:wrap-anywhere" items={[
        ["Status", statusLabel(invite.status)],
        ["Invited by", invite.invitedByEmail],
        ["Created", formatDateTime(invite.createdAt)],
        ["Expiry", formatDateTime(invite.expiresAt)],
      ]} />
    </Dialog>
  );

  const revoke = desk.kind === "revoke";
  return (
    <ReasonDialog title={revoke ? "Revoke invitation?" : "Resend invitation?"}
      description={revoke ? `The invitation link for ${invite.email} will stop working.` : `${invite.email} will receive a new seven-day link. The current link will stop working.`}
      confirmLabel={revoke ? "Revoke" : "Resend"} icon="mail" tone={revoke ? "danger" : "brand"} askReason={false}
      onClose={onClose}
      onConfirm={async () => {
        if (revoke) await revokeAdministratorInvite(invite.id);
        else await resendAdministratorInvite(invite.id);
        onSaved(revoke ? "Invitation revoked" : "Invitation resent");
      }}
    />
  );
}
