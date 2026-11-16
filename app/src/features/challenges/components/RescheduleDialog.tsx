import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ScheduleField } from "@/components/ui/ScheduleField";

export function RescheduleDialog({
  open,
  mode,
  opponent,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: "propose" | "refresh";
  opponent: string;
  pending: boolean;
  error?: string;
  onSubmit: (iso: string) => void;
  onClose: () => void;
}) {
  const [when, setWhen] = useState("");
  const [invalid, setInvalid] = useState("");
  const submit = () => {
    if (!when) return setInvalid("Pick a day and a time.");
    if (new Date(when).getTime() <= Date.now()) return setInvalid("Pick a time in the future.");
    setInvalid("");
    onSubmit(when);
  };

  return (
    <Dialog
      open={open}
      title={mode === "propose" ? "Propose a new time" : "Send it again"}
      description={
        mode === "propose"
          ? `${opponent} has to accept the new time before it replaces the current one.`
          : `${opponent} gets the challenge again with the new time.`
      }
      onClose={onClose}
      dismissible={!pending}
      size="lg"
      footer={
        <>
          <Button tone="ghost" size="sm" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending} onClick={submit}>
            {pending ? "Sending…" : mode === "propose" ? "Propose time" : "Send again"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <ScheduleField value={when} onChange={setWhen} error={invalid || error} />
      </div>
    </Dialog>
  );
}
