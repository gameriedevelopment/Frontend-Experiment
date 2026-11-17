import { Button } from "./Button";
import { Dialog } from "./Dialog";
import type { IconName } from "./Icon";

/** A short, interrupting question before something that can't be undone. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Keep it",
  icon = "warning",
  pending,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: IconName;
  pending: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      dismissible={!pending}
      size="sm"
      icon={icon}
      tone="danger"
      alert
      footer={
        <div className="grid w-full grid-cols-2 gap-2">
          <Button tone="outline" size="sm" disabled={pending} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button size="sm" className="bg-danger text-ink-950 hover:bg-danger/85" disabled={pending} onClick={onConfirm}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </div>
      }
    >
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : undefined}
    </Dialog>
  );
}
