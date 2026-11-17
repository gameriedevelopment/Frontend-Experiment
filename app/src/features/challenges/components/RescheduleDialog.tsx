import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { cn } from "@/lib/cn";
import { formatChallengeDateTime } from "../lifecycle";

export function RescheduleDialog({
  open,
  mode,
  opponent,
  current,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: "propose" | "refresh";
  opponent: string;
  /** The time currently agreed, shown so the change is clear. */
  current: string;
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
      icon={mode === "propose" ? "clock" : "refresh"}
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
      <div className="grid gap-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/6">
          <div className="min-w-0">
            <p className="type-label text-mist-500">{mode === "propose" ? "Agreed" : "Was"}</p>
            <p className="mt-1.5 truncate text-sm font-semibold text-mist-300 line-through decoration-mist-500/60">
              {formatChallengeDateTime(current)}
            </p>
          </div>
          <Icon name="arrowRight" className="size-4 text-mist-500" />
          <div className="min-w-0 text-right">
            <p className="type-label text-lavender-300">New</p>
            <p className={cn("mt-1.5 truncate text-sm font-semibold", !when && "text-mist-500")}>
              {when ? formatChallengeDateTime(when) : "Pick below"}
            </p>
          </div>
        </div>
        <ScheduleField value={when} onChange={setWhen} error={invalid || error} />
      </div>
    </Dialog>
  );
}
