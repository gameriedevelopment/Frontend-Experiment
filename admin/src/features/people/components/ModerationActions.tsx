import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import type { ModeratedKind } from "../api";
import { useModeration } from "../hooks";

type Mode = "ban" | "unban" | "delete";

const NOUN: Record<ModeratedKind, string> = { users: "player", teams: "team", hubs: "hub" };

const COPY: Record<Mode, { title: (name: string) => string; body: (noun: string) => string; confirm: string }> = {
  ban: {
    title: (name) => `Ban ${name}?`,
    body: (noun) => `The ${noun} is hidden and locked out until the ban is lifted. Everything stays in place so a ban can be undone.`,
    confirm: "Ban",
  },
  unban: {
    title: (name) => `Lift the ban on ${name}?`,
    body: (noun) => `The ${noun} becomes visible and usable again straight away.`,
    confirm: "Lift ban",
  },
  delete: {
    title: (name) => `Delete ${name}?`,
    body: (noun) => `This removes the ${noun} for good and can't be undone. Ban instead if you might need it back.`,
    confirm: "Delete for good",
  },
};

/** Ban, lift and delete, each with a reason that lands on the audit log. */
export function ModerationActions({ kind, id, name, banned }: { kind: ModeratedKind; id: string; name: string; banned: boolean }) {
  const navigate = useNavigate();
  const moderation = useModeration(kind, id);
  const [mode, setMode] = useState<Mode | null>(null);
  const [reason, setReason] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const pending = moderation.ban.isPending || moderation.remove.isPending;
  const error = moderation.ban.error ?? moderation.remove.error;

  const close = () => {
    if (pending) return;
    setMode(null);
    setReason("");
    setConfirmName("");
    moderation.ban.reset();
    moderation.remove.reset();
  };

  const submit = () => {
    if (!mode) return;
    const trimmed = reason.trim();
    if (mode === "delete") {
      moderation.remove.mutate(trimmed, {
        onSuccess: () => {
          toast.info(`${name} was deleted`);
          navigate(`/${kind}`, { replace: true });
        },
      });
    } else {
      moderation.ban.mutate(
        { ban: mode === "ban", reason: trimmed },
        {
          onSuccess: () => {
            toast.success(mode === "ban" ? `${name} is banned` : `Ban lifted on ${name}`);
            close();
          },
        },
      );
    }
  };

  const copy = mode ? COPY[mode] : null;
  const ready = reason.trim().length >= 5 && (mode !== "delete" || confirmName === name);

  return (
    <>
      <Button tone="outline" size="sm" icon={banned ? "check" : "prohibit"} className={banned ? undefined : "text-danger"} onClick={() => setMode(banned ? "unban" : "ban")}>
        {banned ? "Lift ban" : "Ban"}
      </Button>
      <Button tone="ghost" size="sm" icon="trash" className="text-mist-400 hover:text-danger" onClick={() => setMode("delete")}>
        Delete
      </Button>
      {mode && copy && (
        <Dialog
          open
          title={copy.title(name)}
          description={copy.body(NOUN[kind])}
          icon={mode === "unban" ? "check" : mode === "ban" ? "prohibit" : "trash"}
          tone={mode === "unban" ? "brand" : "danger"}
          onClose={close}
          dismissible={!pending}
          footer={
            <>
              <Button tone="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button size="sm" disabled={!ready || pending} onClick={submit}>
                {pending ? "Working…" : copy.confirm}
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <TextAreaField
              id="moderation-reason"
              label="Reason (on the audit log)"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="What happened, so the next admin understands"
            />
            {mode === "delete" && (
              <TextField
                id="moderation-confirm"
                label={
                  <>
                    Type <strong className="font-semibold text-mist-50">{name}</strong> to confirm
                  </>
                }
                autoComplete="off"
                value={confirmName}
                onChange={(event) => setConfirmName(event.target.value)}
              />
            )}
            {error && <Notice tone="danger">{getApiErrorMessage(error, "That didn't go through. Try again.")}</Notice>}
          </div>
        </Dialog>
      )}
    </>
  );
}
