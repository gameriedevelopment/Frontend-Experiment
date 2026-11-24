import { useState } from "react";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import type { ComboboxOption } from "@/components/ui/Combobox";
import { TextField } from "@/components/ui/Field";
import { EntityPicker } from "@/features/people/components/EntityPicker";
import { GamePicker } from "@/features/games/GamePicker";
import { createOrganiserResult } from "./api";
import { fromLocalInput, toLocalInput } from "@/lib/time";

const digits = (value: string) => value.replace(/\D/g, "").slice(0, 4);

/** A result from an event Gamerie didn't run, added to both players' records. */
export function OrganiserResultDialog({ onClose, onRecorded }: { onClose: () => void; onRecorded: () => void }) {
  // One key per dialog, so a retry after a timeout can't record the same result twice.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [player1, setPlayer1] = useState<ComboboxOption | null>(null);
  const [player2, setPlayer2] = useState<ComboboxOption | null>(null);
  const [game, setGame] = useState<ComboboxOption | null>(null);
  const [eventName, setEventName] = useState("");
  const [playedAt, setPlayedAt] = useState(() => toLocalInput(new Date().toISOString()));
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const scored = score1 !== "" && score2 !== "";
  const playedInFuture = playedAt !== "" && new Date(playedAt).getTime() > Date.now();
  const ready = Boolean(player1 && player2 && game && eventName.trim().length >= 2 && playedAt && !playedInFuture && scored);
  const outcome =
    scored && player1 && player2
      ? Number(score1) === Number(score2)
        ? "A draw"
        : `${Number(score1) > Number(score2) ? player1.label : player2.label} wins ${Math.max(Number(score1), Number(score2))}–${Math.min(Number(score1), Number(score2))}`
      : null;

  return (
    <ReasonDialog
      title="Record an organiser result"
      description="For matches played at events Gamerie didn't run. It counts on both players' records."
      confirmLabel="Record result"
      icon="trophy"
      tone="brand"
      size="lg"
      ready={ready}
      onClose={onClose}
      onConfirm={(reason) =>
        createOrganiserResult({
          player1Id: player1!.value,
          player2Id: player2!.value,
          gameId: game!.value,
          eventName: eventName.trim(),
          playedAt: fromLocalInput(playedAt),
          player1Score: Number(score1),
          player2Score: Number(score2),
          idempotencyKey,
          reason,
        }).then(onRecorded)
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <EntityPicker id="result-player-1" label="Player one" kind="user" value={player1} onChange={setPlayer1} exclude={player2?.value} />
        <EntityPicker id="result-player-2" label="Player two" kind="user" value={player2} onChange={setPlayer2} exclude={player1?.value} />
      </div>
      <GamePicker id="result-game" value={game} onChange={setGame} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="result-event" label="Event" placeholder="Lagos Winter Cup, quarter-final" value={eventName} maxLength={160} onChange={(event) => setEventName(event.target.value)} />
        <TextField
          id="result-played"
          label="Played"
          type="datetime-local"
          value={playedAt}
          max={toLocalInput(new Date().toISOString())}
          onChange={(event) => setPlayedAt(event.target.value)}
          error={playedInFuture ? "It can't be in the future." : undefined}
        />
      </div>
      <div className="grid gap-2">
        <div className="grid grid-cols-2 gap-3">
          <TextField id="result-score-1" label={`${player1?.label ?? "Player one"} scored`} inputMode="numeric" value={score1} onChange={(event) => setScore1(digits(event.target.value))} />
          <TextField id="result-score-2" label={`${player2?.label ?? "Player two"} scored`} inputMode="numeric" value={score2} onChange={(event) => setScore2(digits(event.target.value))} />
        </div>
        {outcome && <p className="text-sm text-mist-300">{outcome}</p>}
      </div>
    </ReasonDialog>
  );
}
