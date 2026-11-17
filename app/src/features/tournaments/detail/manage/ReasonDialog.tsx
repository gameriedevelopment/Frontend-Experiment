import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/Field";
import type { IconName } from "@/components/ui/Icon";

/** A confirmation that records why, for organizer actions that affect other people. */
export function ReasonDialog({
  title,
  description,
  confirmLabel,
  icon = "warning",
  reasonRequired = true,
  pending,
  error,
  children,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  icon?: IconName;
  reasonRequired?: boolean;
  pending: boolean;
  error?: string;
  children?: ReactNode;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const missing = reasonRequired && reason.trim().length < 4;
  return (
    <Dialog
      open
      title={title}
      description={description}
      icon={icon}
      tone="danger"
      alert
      onClose={onClose}
      dismissible={!pending}
      footer={
        <div className="grid w-full grid-cols-2 gap-2">
          <Button tone="outline" size="sm" disabled={pending} onClick={onClose}>
            Keep it
          </Button>
          <Button
            size="sm"
            className="bg-danger text-ink-950 hover:bg-danger/85"
            disabled={pending || missing}
            onClick={() => onConfirm(reason.trim())}
          >
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4">
        {children}
        <TextAreaField
          id="organizer-reason"
          label={reasonRequired ? "Reason, shared with those affected" : "Reason (optional)"}
          maxLength={300}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="min-h-24"
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
