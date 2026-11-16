import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/errors";
import { useUpdateChallenge } from "../hooks";
import { sideIds, sideNames } from "../lifecycle";
import type { Challenge } from "../types";

function ScoreInput({
  id,
  name,
  value,
  onChange,
  disabled,
}: {
  id: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid min-w-0 justify-items-center gap-3">
      <label htmlFor={id} className="w-full truncate text-center text-sm font-semibold">
        {name}
      </label>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value.replace(/\D/g, "").slice(0, 3));
          onChange(Number.isFinite(next) ? next : 0);
        }}
        className="type-display h-24 w-full rounded-2xl bg-white/4 text-center text-6xl tabular-nums outline-none ring-1 ring-inset ring-white/10 transition-shadow focus:ring-2 focus:ring-lavender-400"
      />
      <div className="flex gap-2">
        {([-1, 1] as const).map((delta) => (
          <button
            key={delta}
            type="button"
            disabled={disabled || (delta < 0 && value === 0)}
            onClick={() => onChange(Math.max(0, value + delta))}
            aria-label={`${delta < 0 ? "Decrease" : "Increase"} ${name}'s score`}
            className="grid size-10 place-items-center rounded-full text-mist-300 ring-1 ring-inset ring-white/12 transition-colors hover:bg-white/6 hover:text-mist-50 disabled:opacity-40"
          >
            <Icon name={delta < 0 ? "minus" : "plus"} weight="bold" className="size-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScoreDialog({ challenge, open, onClose }: { challenge: Challenge; open: boolean; onClose: () => void }) {
  const update = useUpdateChallenge();
  const [first, setFirst] = useState(0);
  const [second, setSecond] = useState(0);
  const [notes, setNotes] = useState("");
  const [firstName, secondName] = sideNames(challenge);
  const [firstId, secondId] = sideIds(challenge);
  const outcome = first === second ? "A draw" : `${first > second ? firstName : secondName} wins`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await update.mutateAsync({
        id: challenge.id,
        type: challenge.type,
        updates: {
          status: "completed",
          result: {
            p1Score: first,
            p2Score: second,
            winnerId: first === second ? "draw" : first > second ? firstId : secondId,
            score: `${first}-${second}`,
            notes: notes.trim() || undefined,
          },
        },
      });
      onClose();
    } catch {
      // Shown below the form.
    }
  };

  return (
    <Dialog
      open={open}
      title="Submit the score"
      description="Enter the final score. The other side can report it if it's wrong."
      onClose={onClose}
      dismissible={!update.isPending}
      size="lg"
      footer={
        <>
          <Button tone="ghost" size="sm" disabled={update.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="challenge-score" size="sm" disabled={update.isPending}>
            {update.isPending ? "Submitting…" : "Submit score"}
          </Button>
        </>
      }
    >
      <form id="challenge-score" onSubmit={(event) => void submit(event)} className="grid gap-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-6">
          <ScoreInput id="score-first" name={firstName} value={first} onChange={setFirst} disabled={update.isPending} />
          <span aria-hidden="true" className="type-display pb-6 text-3xl text-mist-500">
            –
          </span>
          <ScoreInput id="score-second" name={secondName} value={second} onChange={setSecond} disabled={update.isPending} />
        </div>
        <p aria-live="polite" className="text-center text-sm text-mist-300">
          <span className="text-mist-500">Result:</span> {outcome}, {first}–{second}
        </p>
        <TextAreaField
          id="score-notes"
          label="Notes (optional)"
          maxLength={300}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Anything worth noting about the match."
        />
        {update.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(update.error, "The score could not be submitted.")}
          </p>
        )}
      </form>
    </Dialog>
  );
}
