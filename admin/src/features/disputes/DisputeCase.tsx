import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { OptionCards } from "@/components/ui/OptionCards";
import { Stamp } from "@/components/record/Stamp";
import { waited } from "@/features/queue/lanes";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { entityPath } from "@/lib/paths";
import { toast } from "@/lib/toast";
import { useDecision } from "./hooks";
import { SOURCE } from "./sources";
import type { Decision, Dispute } from "./types";

const score = (value: string) => (/^\d{1,3}$/.test(value) ? Number(value) : null);
const isImage = (url: string) => /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);

/** One dispute, its evidence and the decision. Keyed by dispute, so the form resets between cases. */
export function DisputeCase({ dispute, onDecided }: { dispute: Dispute; onDecided: () => void }) {
  const decision = useDecision();
  const [choice, setChoice] = useState<Decision>("confirm");
  const [a, setA] = useState(dispute.claimed?.scoreA?.toString() ?? "");
  const [b, setB] = useState(dispute.claimed?.scoreB?.toString() ?? "");
  const [notes, setNotes] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const source = SOURCE[dispute.source];
  const wait = waited(dispute.raisedAt, source.dueHours);
  const reporter = dispute.reportedBy === "a" ? dispute.sideA : dispute.reportedBy === "b" ? dispute.sideB : null;
  const ready = notes.trim().length >= 5 && (choice !== "correct" || (score(a) !== null && score(b) !== null));

  const submit = () =>
    decision.mutate(
      { dispute, input: { decision: choice, notes, ...(choice === "correct" ? { scoreA: score(a)!, scoreB: score(b)! } : {}) } },
      {
        onSuccess: () => {
          toast.success("Decision recorded", "Both sides have been told.");
          onDecided();
        },
      },
    );

  return (
    <article className="grid gap-6 rounded-card bg-ink-900/70 p-5 ring-1 ring-inset ring-white/6 sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm text-mist-400">
            <Stamp icon={source.icon}>{source.label}</Stamp>
            {dispute.context && <span className="font-mono text-xs">{dispute.context}</span>}
          </p>
          {dispute.competition ? (
            <Link to={entityPath(dispute.source, dispute.competition.id)} className="mt-3 flex items-center gap-1.5 text-lg font-semibold transition-colors hover:text-lavender-200">
              {dispute.competition.name}
              <Icon name="arrowUpRight" className="size-4 text-mist-500" />
            </Link>
          ) : (
            <p className="mt-3 text-lg font-semibold">A deleted competition</p>
          )}
          {dispute.competition?.game && <p className="text-sm text-mist-500">{dispute.competition.game}</p>}
        </div>
        {wait && (
          <span className={cn("rounded-full px-3 py-1.5 font-mono text-xs ring-1 ring-inset", wait.overdue ? "bg-danger/10 text-danger ring-danger/30" : "text-mist-300 ring-white/12")}>
            Waiting {wait.label}
          </span>
        )}
      </header>

      <section aria-label="Reported result" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 rounded-2xl bg-ink-950/60 px-5 py-6 ring-1 ring-inset ring-white/6">
        <p className="min-w-0 text-right">
          <span className="block truncate text-base font-semibold">{dispute.sideA}</span>
          {dispute.reportedBy === "a" && <span className="type-label text-[0.55rem] text-lavender-300">Reported</span>}
        </p>
        <p className="text-center">
          <span className="type-display block text-3xl tabular-nums leading-none">
            {dispute.claimed ? `${dispute.claimed.scoreA}–${dispute.claimed.scoreB}` : "vs"}
          </span>
          <span className="mt-2 block font-mono text-[0.65rem] text-mist-500">{dispute.claimed ? "as reported" : "no score reported"}</span>
        </p>
        <p className="min-w-0">
          <span className="block truncate text-base font-semibold">{dispute.sideB}</span>
          {dispute.reportedBy === "b" && <span className="type-label text-[0.55rem] text-lavender-300">Reported</span>}
        </p>
      </section>

      {(dispute.reason || dispute.evidenceUrl) && (
        <section className="grid gap-3">
          {dispute.reason && (
            <blockquote className="border-l-2 border-lavender-400/50 pl-4 text-sm leading-relaxed text-mist-200">
              “{dispute.reason}”
              {reporter && <footer className="mt-1 text-xs text-mist-500">{reporter}</footer>}
            </blockquote>
          )}
          {dispute.evidenceUrl && (
            <div className="flex flex-wrap items-center gap-3">
              {isImage(dispute.evidenceUrl) && !imageFailed && (
                <a href={dispute.evidenceUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl ring-1 ring-white/10">
                  <img src={dispute.evidenceUrl} alt="Evidence" className="h-28 w-auto object-cover" onError={() => setImageFailed(true)} />
                </a>
              )}
              <ButtonLink href={dispute.evidenceUrl} external tone="outline" size="xs" icon="open">
                Open evidence
              </ButtonLink>
            </div>
          )}
        </section>
      )}

      <section className="grid gap-5 border-t border-white/6 pt-6">
        <OptionCards
          legend="Decision"
          columns={3}
          value={choice}
          onChange={setChoice}
          options={[
            { value: "confirm", label: "Confirm", description: "The reported result stands", icon: "check" },
            { value: "correct", label: "Correct", description: "Set the right score", icon: "edit" },
            { value: "replay", label: "Replay", description: "Void it, play it again", icon: "refresh" },
          ]}
        />
        {choice === "correct" && (
          <div className="grid grid-cols-2 gap-3">
            <TextField id="final-a" label={dispute.sideA} inputMode="numeric" value={a} onChange={(event) => setA(event.target.value.replace(/\D/g, ""))} />
            <TextField id="final-b" label={dispute.sideB} inputMode="numeric" value={b} onChange={(event) => setB(event.target.value.replace(/\D/g, ""))} />
          </div>
        )}
        <TextAreaField
          id="decision-notes"
          label="Note to both sides (also on the audit log)"
          rows={3}
          maxLength={1000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="What you checked and why you decided this way"
        />
        {decision.isError && <Notice tone="danger">{getApiErrorMessage(decision.error, "The decision didn't save. Try again.")}</Notice>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs text-mist-500">Raised {formatDateTime(dispute.raisedAt)}</span>
          <Button size="sm" icon="gavel" disabled={!ready || decision.isPending} onClick={submit}>
            {decision.isPending ? "Saving…" : "Record decision"}
          </Button>
        </div>
      </section>
    </article>
  );
}
