import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OptionCards } from "@/components/ui/OptionCards";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/cn";
import { formatMoney, formatShortDateTime, fromLocalInput, ordinal, toLocalInput } from "../../utils";
import { previewFormat, suggestSplit } from "../draftForm";
import type { StepProps } from "../stepTypes";
import { ChipRow, StepSection, minutesLabel } from "./StepParts";

const intervals = [15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 720, 1440, 2880, 10080];

export function ScheduleStep({ form, update, errors }: StepProps) {
  const s = form.schedule;
  const start = fromLocalInput(s.startsAt);

  // Same slotting as the server: upper and lower rounds interleave, finals follow the longest lane.
  const timetable = useMemo(() => {
    if (!start) return [];
    const preview = previewFormat(form.format, form.rules);
    const interval = s.roundIntervalMinutes * 60_000;
    const base = new Date(start).getTime();
    if (preview.groups) return preview.lanes[0].rounds.map((round, index) => ({ label: round.label, at: base + index * interval }));
    const upper = preview.lanes[0].rounds.filter((round) => round.key.startsWith("upper")).length;
    const lower = preview.lanes.find((lane) => lane.title === "Lower bracket")?.rounds.length ?? 0;
    return preview.lanes
      .flatMap((lane) => lane.rounds)
      .map((round) => {
        const [lane, n] = round.key.split(":");
        const roundNo = Number(n);
        const slot =
          lane === "upper" ? roundNo - 1 : lane === "lower" ? roundNo : lane === "third_place" ? upper - 1 : Math.max(upper, lower + 1) + roundNo - 1;
        return { label: round.label, at: base + slot * interval };
      })
      .sort((a, b) => a.at - b.at);
  }, [form.format, form.rules, s.roundIntervalMinutes, start]);

  const total = Number(s.prizeTotal) || 0;
  const allotted = s.split.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const currency = /^[A-Z]{3}$/.test(s.currency) ? s.currency : "USD";
  const setSplit = (split: typeof s.split) => update("schedule", { split });

  return (
    <div className="grid gap-7">
      <StepSection title="Start">
        <ScheduleField
          label="Bracket starts"
          days={90}
          value={start ?? ""}
          onChange={(iso) => update("schedule", { startsAt: iso ? toLocalInput(iso) : "" })}
          error={errors.startsAt}
        />
      </StepSection>

      <StepSection title="Rounds">
        <OptionCards
          legend="Pacing"
          value={s.roundMode}
          onChange={(roundMode) => update("schedule", { roundMode })}
          options={[
            { value: "fixed", label: "Fixed times", description: "Every round starts at a set time", icon: "clock" },
            { value: "deadline", label: "Play by a deadline", description: "Opponents agree a time within each round", icon: "hourglass" },
          ]}
        />
        <ChipRow
          legend={s.roundMode === "fixed" ? "A new round every" : "Each round lasts"}
          options={intervals}
          value={s.roundIntervalMinutes}
          format={minutesLabel}
          onChange={(roundIntervalMinutes) => update("schedule", { roundIntervalMinutes })}
        />
        {timetable.length > 0 && (
          <ol className="grid gap-px overflow-hidden rounded-2xl bg-white/6 ring-1 ring-inset ring-white/6">
            {timetable.slice(0, 12).map((row) => (
              <li key={`${row.label}-${row.at}`} className="flex items-center justify-between gap-4 bg-ink-900 px-4 py-2.5 text-sm">
                <span className="text-mist-200">{row.label}</span>
                <span className="tabular-nums text-mist-400">
                  {s.roundMode === "deadline" ? "Play by " : ""}
                  {formatShortDateTime(new Date(row.at + (s.roundMode === "deadline" ? s.roundIntervalMinutes * 60_000 : 0)).toISOString())}
                </span>
              </li>
            ))}
            {timetable.length > 12 && (
              <li className="bg-ink-900 px-4 py-2.5 text-xs text-mist-500">And {timetable.length - 12} more rounds</li>
            )}
          </ol>
        )}
      </StepSection>

      <StepSection title="Prize">
        <Switch
          label="This tournament has a prize"
          description="You pay prizes yourself; Gamerie shows them and records the placings."
          checked={s.hasPrize}
          onChange={(hasPrize) => update("schedule", { hasPrize })}
        />
        {s.hasPrize && (
          <div className="grid gap-5">
            <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3 sm:max-w-md">
              <TextField
                id="prize-total"
                label="Prize pool"
                inputMode="decimal"
                placeholder="500"
                value={s.prizeTotal}
                onChange={(event) => update("schedule", { prizeTotal: event.target.value.replace(/[^\d.]/g, "") })}
                error={errors.prizeTotal}
              />
              <TextField
                id="prize-currency"
                label="Currency"
                maxLength={3}
                value={s.currency}
                onChange={(event) => update("schedule", { currency: event.target.value.toUpperCase().replace(/[^A-Z]/g, "") })}
                error={errors.currency}
              />
            </div>
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-mist-200">Split by place</p>
                <Button
                  tone="ghost"
                  size="sm"
                  icon="spark"
                  disabled={!total}
                  onClick={() => setSplit(suggestSplit(total, Math.min(4, form.format.bracketSize)))}
                >
                  Suggest a split
                </Button>
              </div>
              {s.split.length > 0 && (
                <ul className="grid gap-2">
                  {s.split.map((row, index) => (
                    <li key={index} className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
                      <span className={cn("text-sm font-semibold", row.placement === 1 ? "text-signal" : "text-mist-300")}>
                        {ordinal(row.placement)}
                      </span>
                      <input
                        aria-label={`${ordinal(row.placement)} place amount`}
                        inputMode="decimal"
                        value={row.amount}
                        onChange={(event) =>
                          setSplit(s.split.map((item, i) => (i === index ? { ...item, amount: event.target.value.replace(/[^\d.]/g, "") } : item)))
                        }
                        className="h-10 rounded-xl bg-white/4 px-3 text-sm tabular-nums outline-none pointer-coarse:text-base ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-lavender-400"
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${ordinal(row.placement)} place`}
                        onClick={() => setSplit(s.split.filter((_, i) => i !== index).map((item, i) => ({ ...item, placement: i + 1 })))}
                        className="grid size-9 place-items-center rounded-lg text-mist-500 hover:bg-white/6 hover:text-danger"
                      >
                        <Icon name="close" className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  tone="outline"
                  size="sm"
                  icon="plus"
                  disabled={s.split.length >= form.format.bracketSize}
                  onClick={() => setSplit([...s.split, { placement: s.split.length + 1, amount: "" }])}
                >
                  Add a place
                </Button>
                {s.split.length > 0 && (
                  <span className={cn("text-sm tabular-nums", Math.abs(allotted - total) < 0.01 ? "text-signal" : "text-mist-400")}>
                    {formatMoney(allotted, currency)} of {formatMoney(total, currency)} allotted
                  </span>
                )}
              </div>
              {errors.split && (
                <p role="alert" className="text-[0.8rem] text-danger">
                  {errors.split}
                </p>
              )}
            </div>
            <TextField
              id="prize-description"
              label="How it's paid (optional)"
              maxLength={200}
              value={s.prizeDescription}
              onChange={(event) => update("schedule", { prizeDescription: event.target.value })}
              placeholder="Paid by bank transfer within 7 days of the final."
            />
          </div>
        )}
      </StepSection>
    </div>
  );
}
