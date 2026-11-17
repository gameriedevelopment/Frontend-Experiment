import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { OptionCards } from "@/components/ui/OptionCards";
import type { HostingOption } from "../../types";
import { FORMAT_LABELS, formatMoney, formatShortDateTime, fromLocalInput } from "../../utils";
import { STEPS, TIEBREAKER_LABELS, previewFormat, type DraftForm, type StepKey } from "../draftForm";
import { minutesLabel } from "./StepParts";

function Block({ title, step, onEdit, children }: { title: string; step: StepKey; onEdit: (step: StepKey) => void; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/6 sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button type="button" onClick={() => onEdit(step)} className="text-sm font-medium text-lavender-300 hover:text-lavender-200">
          Edit
        </button>
      </header>
      <dl className="grid gap-2.5">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 text-sm">
      <dt className="text-mist-500">{label}</dt>
      <dd className="min-w-0 text-mist-100">{value}</dd>
    </div>
  );
}

export function ReviewStep({
  form,
  gameName,
  hosts,
  problems,
  visibility,
  onVisibility,
  onEdit,
  published,
}: {
  form: DraftForm;
  gameName: string;
  hosts: HostingOption[];
  problems: Array<{ step: StepKey; message: string }>;
  visibility: "public" | "unlisted";
  onVisibility: (value: "public" | "unlisted") => void;
  onEdit: (step: StepKey) => void;
  published: boolean;
}) {
  const { basics: b, format: f, rules: r, registration: reg, schedule: s } = form;
  const host = hosts.find((item) => `${item.type}:${item.id}` === b.host);
  const preview = previewFormat(f, r);
  const stepLabel = (step: StepKey) => STEPS.find((item) => item.key === step)?.label;

  return (
    <div className="grid gap-5">
      {problems.length > 0 && (
        <div role="alert" className="rounded-2xl bg-danger/8 p-4 ring-1 ring-inset ring-danger/25">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Icon name="warning" className="size-4 text-danger" />
            {problems.length === 1 ? "One thing to fix before publishing" : `${problems.length} things to fix before publishing`}
          </p>
          <ul className="mt-3 grid gap-1.5">
            {problems.map((problem) => (
              <li key={`${problem.step}-${problem.message}`}>
                <button type="button" onClick={() => onEdit(problem.step)} className="text-left text-sm text-mist-300 hover:text-mist-50">
                  <span className="font-medium text-mist-100">{stepLabel(problem.step)}:</span> {problem.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Block title="Basics" step="basics" onEdit={onEdit}>
          <Row label="Name" value={b.name || "Not set"} />
          <Row label="Host" value={host?.name ?? "Not set"} />
          <Row label="Game" value={`${gameName || "Not set"}${b.platform ? ` · ${b.platform}` : ""}`} />
          <Row label="Where" value={b.mode === "lan" ? `${b.venueName || "Venue not set"} · ${b.region}` : `Online · ${b.region}`} />
        </Block>
        <Block title="Format" step="format" onEdit={onEdit}>
          <Row label="Bracket" value={`${FORMAT_LABELS[f.format]}, up to ${f.bracketSize}`} />
          <Row label="Entrants" value={f.entrantType === "team" ? `Teams of ${f.teamSize}, ${f.substitutes} subs` : "Players"} />
          <Row label="Minimum" value={`${f.minEntrants} to start`} />
          <Row label="Matches" value={`${preview.totalMatches} in total · ${f.seedingMethod === "manual" ? "manual seeds" : "random seeds"}`} />
        </Block>
        <Block title="Match rules" step="rules" onEdit={onEdit}>
          <Row label="Series" value={`Best of ${r.bestOf}${Object.keys(r.rounds).length ? ", longer later" : ""}`} />
          {f.format === "round_robin" ? (
            <Row label="Ties" value={r.tiebreakers.map((item) => TIEBREAKER_LABELS[item]).join(", ") || "Shared places"} />
          ) : (
            <Row label="Finals" value={f.format === "single_elimination" ? (r.thirdPlaceMatch ? "Third-place match" : "Third shared") : r.grandFinalMode.replace("_", " ")} />
          )}
          <Row label="Timers" value={`No-show ${minutesLabel(r.noShowMinutes)} · report ${minutesLabel(r.reportWindowMinutes)}`} />
        </Block>
        <Block title="Registration" step="registration" onEdit={onEdit}>
          <Row label="Joining" value={reg.registrationMode === "open" ? "Open" : reg.registrationMode === "approval" ? "With approval" : "Invite only"} />
          <Row label="Closes" value={formatShortDateTime(fromLocalInput(reg.registrationClosesAt))} />
          <Row label="Check-in" value={`${minutesLabel(reg.checkInOpensMinutesBefore)} to ${reg.checkInClosesMinutesBefore ? minutesLabel(reg.checkInClosesMinutesBefore) : "0 min"} before`} />
        </Block>
        <Block title="Schedule and prize" step="schedule" onEdit={onEdit}>
          <Row label="Starts" value={formatShortDateTime(fromLocalInput(s.startsAt))} />
          <Row label="Rounds" value={`${s.roundMode === "fixed" ? "Every" : "Within"} ${minutesLabel(s.roundIntervalMinutes)}`} />
          <Row
            label="Prize"
            value={s.hasPrize && Number(s.prizeTotal) ? formatMoney(Number(s.prizeTotal), /^[A-Z]{3}$/.test(s.currency) ? s.currency : "USD") : "No prize"}
          />
        </Block>
      </div>

      {!published && (
        <OptionCards
          legend="Who can find it"
          value={visibility}
          onChange={onVisibility}
          options={[
            { value: "public", label: "Public", description: "Listed in Tournaments and open to search", icon: "globe" },
            { value: "unlisted", label: "Unlisted", description: "Only people with the link can find it", icon: "lock" },
          ]}
        />
      )}
    </div>
  );
}
