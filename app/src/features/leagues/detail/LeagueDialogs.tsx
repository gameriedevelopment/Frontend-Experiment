import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ScheduleField } from "@/components/ui/ScheduleField";
import type { LeagueFixture, LeagueSeason } from "../types";

function ErrorLine({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 text-sm text-danger">
      <Icon name="warning" className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

export function ProposeTimeDialog({
  fixture,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  fixture: LeagueFixture;
  pending: boolean;
  error?: string;
  onSubmit: (at: string) => void;
  onClose: () => void;
}) {
  const [at, setAt] = useState(fixture.proposedAt ?? fixture.matchAt);
  return (
    <Dialog
      open
      title="Propose another time"
      description={`Your opponent has to accept it. The match stays in week ${fixture.week}; if you don't agree, the default time stands.`}
      icon="calendar"
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending || !at} onClick={() => onSubmit(at)}>
            {pending ? "Sending…" : "Send proposal"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <ScheduleField label="New time" days={14} value={at} onChange={setAt} />
        <ErrorLine message={error} />
      </div>
    </Dialog>
  );
}

export function ResultDialog({
  fixture,
  season,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  fixture: LeagueFixture;
  season: LeagueSeason;
  pending: boolean;
  error?: string;
  onSubmit: (input: { scoreA: number; scoreB: number; notes?: string }) => void;
  onClose: () => void;
}) {
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [notes, setNotes] = useState("");
  const target = Math.ceil(season.bestOf / 2);
  const drawsAllowed = season.allowDraws && fixture.stage === "regular";
  const a = Number(scoreA);
  const b = Number(scoreB);
  const filled = scoreA !== "" && scoreB !== "";
  const local = !filled
    ? ""
    : a === b
      ? drawsAllowed
        ? ""
        : "This match needs a winner."
      : Math.max(a, b) !== target || Math.min(a, b) >= target
        ? `In a best of ${season.bestOf}, the winner takes ${target}.`
        : "";
  return (
    <Dialog
      open
      title="Report the result"
      description={`Games won by each side. Your opponent has an hour to accept or dispute it; after that it stands.`}
      icon="flag"
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending || !filled || Boolean(local)} onClick={() => onSubmit({ scoreA: a, scoreB: b, notes: notes.trim() || undefined })}>
            {pending ? "Sending…" : "Report result"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <TextField id="score-a" label={fixture.sideA.name} inputMode="numeric" value={scoreA} onChange={(event) => setScoreA(event.target.value.replace(/\D/g, "").slice(0, 2))} />
          <TextField id="score-b" label={fixture.sideB.name} inputMode="numeric" value={scoreB} onChange={(event) => setScoreB(event.target.value.replace(/\D/g, "").slice(0, 2))} />
        </div>
        <p className="text-xs text-mist-500">
          Best of {season.bestOf}. {drawsAllowed ? "Draws are allowed." : "There has to be a winner."}
        </p>
        <TextAreaField id="result-notes" label="Notes (optional)" maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything the other side or the organizer should know." />
        <ErrorLine message={local || error} />
      </div>
    </Dialog>
  );
}

export function DisputeDialog({
  pending,
  error,
  onSubmit,
  onClose,
}: {
  pending: boolean;
  error?: string;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog
      open
      title="Dispute this result"
      description="Gamerie reviews it and confirms, corrects or orders a replay. Say what really happened."
      icon="warning"
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending || reason.trim().length < 5} onClick={() => onSubmit(reason.trim())}>
            {pending ? "Sending…" : "Send dispute"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <TextAreaField id="dispute-reason" label="What's wrong with it?" maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="We won the second map 13–9; the screenshot is in the match chat." />
        <ErrorLine message={error} />
      </div>
    </Dialog>
  );
}
