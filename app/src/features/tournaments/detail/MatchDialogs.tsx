import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { reportChallengeScore, type ReportReason } from "@/features/challenges/api";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { declareScore, proposeMatchTime, respondToProposal, setMatchTime } from "../api";
import { useTournamentAction } from "../hooks";
import type { BracketEntrant, BracketMatch, HostedTournamentDetail } from "../types";
import { judgeSeriesScore, validScores } from "./score";

interface MatchDialogProps {
  tournament: HostedTournamentDetail;
  match: BracketMatch;
  entrants: Map<string, BracketEntrant>;
  onClose: () => void;
}

const nameOf = (entrants: Map<string, BracketEntrant>, id: string | null, fallback: string) =>
  (id && entrants.get(id)?.name) || fallback;

export function DeclareScoreDialog({ tournament, match, entrants, onClose }: MatchDialogProps) {
  const allowDraw = Boolean(tournament.matchRules?.allowDraws && tournament.format === "round_robin");
  const options = validScores(match.bestOf, allowDraw);
  const [choice, setChoice] = useState<[number, number] | null>(null);
  const nameA = nameOf(entrants, match.sideA.entrantId, "Side A");
  const nameB = nameOf(entrants, match.sideB.entrantId, "Side B");
  const windowMinutes = tournament.matchRules?.reportWindowMinutes ?? 60;
  const action = useTournamentAction(tournament.id, ([a, b]: [number, number]) => declareScore(tournament.id, match.id, a, b));
  const verdict = choice ? judgeSeriesScore(match.bestOf, choice[0], choice[1], allowDraw) : null;

  const submit = () => {
    if (!choice || !verdict?.valid) return;
    action.mutate(choice, {
      onSuccess: () => {
        toast.success("Score declared", `It's final in ${windowMinutes} minutes unless it's reported.`);
        onClose();
      },
    });
  };

  return (
    <Dialog
      open
      title="Declare the score"
      description={`Best of ${match.bestOf}. Pick the final series score.`}
      icon="trophy"
      size="lg"
      onClose={onClose}
      dismissible={!action.isPending}
      footer={
        <>
          <Button tone="ghost" size="sm" disabled={action.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!verdict?.valid || action.isPending} onClick={submit}>
            {action.isPending ? "Declaring…" : "Declare score"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 text-center">
          <p className="truncate text-sm font-semibold">{nameA}</p>
          <span className="type-label text-mist-500">vs</span>
          <p className="truncate text-sm font-semibold">{nameB}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {options.map(([a, b]) => {
            const selected = choice?.[0] === a && choice?.[1] === b;
            const winner = a === b ? "Draw" : a > b ? nameA : nameB;
            return (
              <button
                key={`${a}-${b}`}
                type="button"
                aria-pressed={selected}
                onClick={() => setChoice([a, b])}
                className={cn(
                  "grid gap-1 rounded-2xl px-4 py-3.5 text-center ring-1 ring-inset transition-[background-color,box-shadow] duration-200",
                  selected ? "bg-lavender-400/12 ring-lavender-400/70" : "bg-white/4 ring-white/10 hover:bg-white/7",
                )}
              >
                <span className="type-display text-2xl tabular-nums leading-none">
                  {a}–{b}
                </span>
                <span className="truncate text-xs text-mist-400">{a === b ? "Draw" : `${winner} wins`}</span>
              </button>
            );
          })}
        </div>
        <p className="rounded-2xl bg-white/3 px-4 py-3 text-sm leading-relaxed text-mist-400 ring-1 ring-inset ring-white/6">
          Your opponent can't declare a different score. They have {windowMinutes} minutes to report it if it's wrong, or it
          becomes final.
        </p>
        {action.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(action.error, "The score couldn't be declared.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}

export function TimeDialog({
  tournament,
  match,
  entrants,
  mode,
  onClose,
}: MatchDialogProps & { mode: "propose" | "counter" | "organizer" }) {
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [invalid, setInvalid] = useState("");
  const action = useTournamentAction(tournament.id, async (iso: string) => {
    if (mode === "organizer") await setMatchTime(tournament.id, match.id, iso);
    else if (mode === "counter")
      await respondToProposal(tournament.id, match.id, { action: "counter", scheduledAt: iso, note: note || undefined });
    else await proposeMatchTime(tournament.id, match.id, iso, note || undefined);
  });
  const opponents = [match.sideA.entrantId, match.sideB.entrantId].map((id) => nameOf(entrants, id, "Opponent"));
  const deadline = match.deadlineAt ? new Date(match.deadlineAt) : null;

  const submit = () => {
    if (!when) return setInvalid("Pick a day and a time.");
    if (new Date(when).getTime() <= Date.now()) return setInvalid("Pick a time in the future.");
    if (deadline && new Date(when) > deadline) return setInvalid("Pick a time before the round deadline.");
    setInvalid("");
    action.mutate(when, {
      onSuccess: () => {
        toast.success(mode === "organizer" ? "Match time set" : "Time proposed", mode === "organizer" ? opponents.join(" vs ") : "Your opponent needs to accept it.");
        onClose();
      },
    });
  };

  return (
    <Dialog
      open
      title={mode === "organizer" ? "Set the match time" : mode === "counter" ? "Suggest another time" : "Propose a match time"}
      description={
        deadline
          ? `Play before ${new Intl.DateTimeFormat(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" }).format(deadline)}.`
          : `${opponents[0]} vs ${opponents[1]}`
      }
      icon="clock"
      size="lg"
      onClose={onClose}
      dismissible={!action.isPending}
      footer={
        <>
          <Button tone="ghost" size="sm" disabled={action.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={action.isPending} onClick={submit}>
            {action.isPending ? "Sending…" : mode === "organizer" ? "Set time" : "Send proposal"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6">
        <ScheduleField value={when} onChange={setWhen} error={invalid} />
        {mode !== "organizer" && (
          <TextField
            id="match-time-note"
            label="Note (optional)"
            maxLength={140}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Server, lobby name, or anything they should know"
          />
        )}
        {action.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(action.error, "The time couldn't be sent.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}

const reasons: Array<{ value: ReportReason; label: string }> = [
  { value: "other", label: "Wrong score" },
  { value: "inappropriate", label: "Cheating or an unlisted player" },
  { value: "harassment", label: "Abuse during the match" },
];

export function ReportMatchDialog({ tournament, match, onClose }: Omit<MatchDialogProps, "entrants">) {
  const [type, setType] = useState<ReportReason>("other");
  const [reason, setReason] = useState("");
  const [invalid, setInvalid] = useState("");
  const action = useTournamentAction(tournament.id, () =>
    reportChallengeScore({
      challengeId: match.challenge!.id,
      contentAuthorId: match.challenge?.declaredBy ?? tournament.ownerId ?? "",
      type,
      reason: reason.trim(),
    }),
  );

  const submit = () => {
    if (reason.trim().length < 10) return setInvalid("Describe the problem in at least 10 characters.");
    setInvalid("");
    action.mutate(undefined, {
      onSuccess: () => {
        toast.success("Report sent", "Only this match waits while a Gamerie admin decides.");
        onClose();
      },
    });
  };

  return (
    <Dialog
      open
      title={`Report match #${match.number}`}
      description="A Gamerie admin will confirm the result, correct it, or order a replay. The rest of the bracket keeps going."
      icon="flag"
      tone="danger"
      size="lg"
      onClose={onClose}
      dismissible={!action.isPending}
      footer={
        <>
          <Button tone="ghost" size="sm" disabled={action.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={action.isPending} onClick={submit}>
            {action.isPending ? "Sending…" : "Send report"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6">
        <ChoiceGroup legend="What happened?" columns={3}>
          {reasons.map((item) => (
            <ChoiceChip
              key={item.value}
              name="match-report"
              value={item.value}
              checked={type === item.value}
              onChange={() => setType(item.value)}
              label={item.label}
            />
          ))}
        </ChoiceGroup>
        <TextAreaField
          id="match-report-details"
          label="Details"
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="What happened, and what the result should be. Mention screenshots or clips you can share."
          error={invalid}
        />
        {action.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(action.error, "The report couldn't be sent.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}
