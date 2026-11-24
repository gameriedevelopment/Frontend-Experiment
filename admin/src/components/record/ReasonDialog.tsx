import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, type DialogSize, type DialogTone } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/Field";
import type { IconName } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { getApiErrorMessage } from "@/lib/errors";

/** Any admin action that needs a reason on the audit log. `children` adds the action's own fields. */
export function ReasonDialog({
  title,
  description,
  confirmLabel,
  icon,
  tone = "danger",
  onConfirm,
  onClose,
  ready = true,
  validate,
  minLength = 5,
  askReason = true,
  size = "md",
  children,
}: {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  icon: IconName;
  tone?: DialogTone;
  onConfirm: (reason: string) => Promise<unknown>;
  onClose: () => void;
  /** False while the action's own fields are incomplete. */
  ready?: boolean;
  validate?: () => boolean;
  minLength?: number;
  /** False when the action takes no reason, so the dialog only confirms. */
  askReason?: boolean;
  size?: DialogSize;
  children?: ReactNode;
}) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const submit = async () => {
    if (validate && !validate()) return;
    setPending(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  };
  return (
    <Dialog
      open
      title={title}
      description={description}
      icon={icon}
      tone={tone}
      size={size}
      onClose={() => !pending && onClose()}
      dismissible={!pending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending || !ready || (askReason && reason.trim().length < minLength)} onClick={() => void submit()}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {children}
        {askReason && (
          <TextAreaField
            id="action-reason"
            label="Reason (on the audit log)"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="What happened, so the next admin understands"
          />
        )}
        {error != null && <Notice tone="danger">{getApiErrorMessage(error, "That didn't go through. Try again.")}</Notice>}
      </div>
    </Dialog>
  );
}
