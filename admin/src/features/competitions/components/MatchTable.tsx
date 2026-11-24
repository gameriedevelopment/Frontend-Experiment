import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { cn } from "@/lib/cn";
import { formatDateTime, statusLabel } from "@/lib/format";
import type { MatchRow } from "../types";

export interface MatchActions {
  /** Absent when the match can't be corrected. */
  correct?: (match: MatchRow, scoreA: number, scoreB: number, reason: string) => Promise<unknown>;
  cancel?: (match: MatchRow, reason: string) => Promise<unknown>;
  canAct: (match: MatchRow) => { correct: boolean; cancel: boolean };
}

const score = (value: string) => (/^\d{1,3}$/.test(value) ? Number(value) : null);

function CorrectDialog({ match, onConfirm, onClose }: { match: MatchRow; onConfirm: (a: number, b: number, reason: string) => Promise<unknown>; onClose: () => void }) {
  const [a, setA] = useState(match.scoreA?.toString() ?? "");
  const [b, setB] = useState(match.scoreB?.toString() ?? "");
  const ready = score(a) !== null && score(b) !== null;
  return (
    <ReasonDialog
      title="Correct the result"
      description="The table is recalculated from the corrected score, and both sides are told."
      confirmLabel="Save result"
      icon="edit"
      tone="brand"
      ready={ready}
      onClose={onClose}
      onConfirm={(reason) => onConfirm(score(a)!, score(b)!, reason)}
    >
      <div className="grid grid-cols-2 gap-3">
        <TextField id="score-a" label={match.sideA.name} inputMode="numeric" value={a} onChange={(event) => setA(event.target.value.replace(/\D/g, ""))} />
        <TextField id="score-b" label={match.sideB.name} inputMode="numeric" value={b} onChange={(event) => setB(event.target.value.replace(/\D/g, ""))} />
      </div>
    </ReasonDialog>
  );
}

/** Ladder and league matches in one shape, with correct and cancel for admins. */
export function MatchTable({ rows, loading, actions, empty }: { rows: MatchRow[]; loading: boolean; actions: MatchActions; empty: string }) {
  const [correcting, setCorrecting] = useState<MatchRow | null>(null);
  const [cancelling, setCancelling] = useState<MatchRow | null>(null);

  if (loading) return <Skeleton className="h-48 rounded-2xl" />;
  if (rows.length === 0) return <p className="text-sm text-mist-400">{empty}</p>;

  return (
    <>
      <ul className="-mx-2 grid grid-cols-[minmax(0,1fr)]">
        {rows.map((match) => {
          const can = actions.canAct(match);
          const decided = match.scoreA !== null && match.scoreB !== null;
          return (
            <li key={match.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-white/3">
              <span className="min-w-0">
                <span className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
                  <span className={cn("truncate text-right", match.winner === "a" ? "font-semibold text-mist-50" : "text-mist-300")}>{match.sideA.name}</span>
                  <span className="min-w-14 rounded-md bg-white/5 px-2 py-0.5 text-center font-mono text-xs tabular-nums text-mist-100">{decided ? `${match.scoreA}–${match.scoreB}` : "vs"}</span>
                  <span className={cn("truncate", match.winner === "b" ? "font-semibold text-mist-50" : "text-mist-300")}>{match.sideB.name}</span>
                </span>
                <span className="mt-1 block text-center font-mono text-[0.68rem] text-mist-500">
                  {[match.label, statusLabel(match.status), match.when ? formatDateTime(match.when) : null].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="flex gap-1">
                {can.correct && actions.correct && (
                  <Button tone="ghost" size="xs" onClick={() => setCorrecting(match)}>
                    Correct
                  </Button>
                )}
                {can.cancel && actions.cancel && (
                  <Button tone="ghost" size="xs" className="text-mist-400 hover:text-danger" onClick={() => setCancelling(match)}>
                    Cancel
                  </Button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {correcting && actions.correct && (
        <CorrectDialog match={correcting} onClose={() => setCorrecting(null)} onConfirm={(a, b, reason) => actions.correct!(correcting, a, b, reason)} />
      )}
      {cancelling && actions.cancel && (
        <ReasonDialog
          title="Cancel this match?"
          description={`${cancelling.sideA.name} vs ${cancelling.sideB.name}. Any result is removed and the table is recalculated.`}
          confirmLabel="Cancel match"
          icon="close"
          onClose={() => setCancelling(null)}
          onConfirm={(reason) => actions.cancel!(cancelling, reason)}
        />
      )}
    </>
  );
}
