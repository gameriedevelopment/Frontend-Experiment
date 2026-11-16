import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { sideNames } from "../lifecycle";
import type { Challenge, EligibleLineupMember } from "../types";
import { LineupPicker } from "./LineupPicker";

export function ChallengeLineups({
  challenge,
  locked,
  ready,
  editor,
  onEdit,
}: {
  challenge: Challenge;
  locked: boolean;
  ready: boolean;
  /** Present when the viewer can pick their own team's lineup right now. */
  editor?: {
    members: EligibleLineupMember[];
    loading: boolean;
    selected: string[];
    unavailable: string[];
    onChange: (ids: string[]) => void;
    /** Inline save controls; absent while the lineup is part of accepting the challenge. */
    save?: { pending: boolean; onSave: () => void; onCancel: () => void };
  };
  onEdit?: () => void;
}) {
  const names = sideNames(challenge);
  const required = challenge.teamSize ?? 0;
  const status =
    challenge.lineupRequired === false
      ? "Lineups weren't recorded for this match."
      : locked
        ? "Locked at match time."
        : ready
          ? "Both rosters are set."
          : "Both teams need to name their players.";

  return (
    <section className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Lineups</h2>
          <p className="mt-1 text-sm text-mist-400">{status}</p>
        </div>
        {locked && <Icon name="lock" className="size-4 text-mist-500" />}
        {onEdit && !editor && (
          <Button tone="ghost" size="sm" icon="edit" onClick={onEdit}>
            Edit yours
          </Button>
        )}
      </header>

      {challenge.lineupRequired !== false && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {(["challenger", "challenged"] as const).map((side, index) => {
            const members = (challenge.lineups ?? []).filter((member) => member.side === side);
            return (
              <div key={side} className="rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/6">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold">{names[index]}</p>
                  <span className="type-label tabular-nums text-mist-500">
                    {members.length} / {required}
                  </span>
                </div>
                {members.length ? (
                  <ul className="mt-3 grid gap-1.5 text-sm text-mist-300">
                    {members.map((member) => (
                      <li key={member.id} className="flex items-center gap-2">
                        <span aria-hidden="true" className="size-1 rounded-full bg-lavender-300" />
                        {member.playerNameSnapshot}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-mist-500">Not named yet</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editor && (
        <div className="mt-6 grid gap-4 border-t border-white/6 pt-6">
          <LineupPicker
            members={editor.members}
            selected={editor.selected}
            unavailablePlayerIds={editor.unavailable}
            required={required}
            onChange={editor.onChange}
            loading={editor.loading}
            disabled={editor.save?.pending}
          />
          {editor.save && (
            <div className="flex justify-end gap-2">
              <Button tone="ghost" size="sm" disabled={editor.save.pending} onClick={editor.save.onCancel}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={editor.save.pending || editor.selected.length !== required}
                onClick={editor.save.onSave}
              >
                {editor.save.pending ? "Saving…" : "Save lineup"}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
