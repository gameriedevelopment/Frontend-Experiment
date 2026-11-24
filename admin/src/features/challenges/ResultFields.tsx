import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { TextAreaField, TextField } from "@/components/ui/Field";

export type Winner = "first" | "second" | "draw";

export interface ResultDraft {
  score1: string;
  score2: string;
  winner: Winner | "";
  notes: string;
}

/** The winner a score implies, which the admin can still overrule (a forfeit, say). */
export const impliedWinner = (score1: string, score2: string): Winner | "" =>
  score1 === "" || score2 === "" ? "" : Number(score1) === Number(score2) ? "draw" : Number(score1) > Number(score2) ? "first" : "second";

const digits = (value: string) => value.replace(/\D/g, "").slice(0, 4);

export function ResultFields({ names, value, onChange }: { names: [string, string]; value: ResultDraft; onChange: (value: ResultDraft) => void }) {
  const setScore = (key: "score1" | "score2", raw: string) => {
    const next = { ...value, [key]: digits(raw) };
    onChange({ ...next, winner: impliedWinner(next.score1, next.score2) || value.winner });
  };
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-3">
        <TextField id="result-score-first" label={`${names[0]} scored`} inputMode="numeric" value={value.score1} onChange={(event) => setScore("score1", event.target.value)} />
        <TextField id="result-score-second" label={`${names[1]} scored`} inputMode="numeric" value={value.score2} onChange={(event) => setScore("score2", event.target.value)} />
      </div>
      <ChoiceGroup legend="Winner" hint="Set from the score; change it for a forfeit" columns={3}>
        {(["first", "draw", "second"] as const).map((winner) => (
          <ChoiceChip
            key={winner}
            name="result-winner"
            label={winner === "draw" ? "Draw" : <span className="truncate">{names[winner === "first" ? 0 : 1]}</span>}
            checked={value.winner === winner}
            onChange={() => onChange({ ...value, winner })}
          />
        ))}
      </ChoiceGroup>
      <TextAreaField id="result-notes" label="Notes (optional)" rows={2} maxLength={1000} value={value.notes} onChange={(event) => onChange({ ...value, notes: event.target.value })} />
    </div>
  );
}
