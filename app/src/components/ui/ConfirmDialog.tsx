import { Button } from "./Button";
import { Dialog } from "./Dialog";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button tone="ghost" size="sm" disabled={pending} onClick={onClose}>
            Keep it
          </Button>
          <Button size="sm" className="bg-danger text-ink-950 hover:bg-danger/85" disabled={pending} onClick={onConfirm}>
            {pending ? "Working…" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 px-3 pb-3 pt-2">
        <p className="text-sm leading-relaxed text-mist-300">{description}</p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
