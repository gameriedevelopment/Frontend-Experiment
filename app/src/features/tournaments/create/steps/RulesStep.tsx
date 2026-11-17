import { useMemo, useState } from "react";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OptionCards } from "@/components/ui/OptionCards";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/cn";
import type { Tiebreaker } from "../../types";
import { BEST_OF, TIEBREAKER_LABELS, previewFormat } from "../draftForm";
import type { StepProps } from "../stepTypes";
import { ChipRow, StepSection, minutesLabel } from "./StepParts";

const allTiebreakers = Object.keys(TIEBREAKER_LABELS) as Tiebreaker[];

export function RulesStep({ form, update, errors }: StepProps) {
  const f = form.format;
  const r = form.rules;
  const elimination = f.format !== "round_robin";
  const rounds = useMemo(() => (elimination ? previewFormat(f, r).lanes.flatMap((lane) => lane.rounds) : []), [elimination, f, r]);
  const overrides = Object.keys(r.rounds).length;
  const [showRounds, setShowRounds] = useState(overrides > 0);

  const moveTiebreaker = (index: number, delta: number) => {
    const next = [...r.tiebreakers];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update("rules", { tiebreakers: next });
  };
  const toggleTiebreaker = (value: Tiebreaker) =>
    update("rules", {
      tiebreakers: r.tiebreakers.includes(value) ? r.tiebreakers.filter((item) => item !== value) : [...r.tiebreakers, value],
    });

  return (
    <div className="grid gap-7">
      <StepSection title="Series length" description="Players declare the final series score, for example 2–1.">
        <ChipRow
          legend="Every match is"
          options={BEST_OF}
          value={r.bestOf}
          format={(value) => `Best of ${value}`}
          onChange={(bestOf) => update("rules", { bestOf })}
        />
        {elimination && rounds.length > 1 && (
          <div className="rounded-2xl bg-white/3 ring-1 ring-inset ring-white/6">
            <button
              type="button"
              aria-expanded={showRounds}
              onClick={() => setShowRounds((value) => !value)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium"
            >
              <span>
                Longer series for later rounds
                {overrides > 0 && <span className="ml-2 text-lavender-300">{overrides} changed</span>}
              </span>
              <Icon name="chevronDown" className={cn("size-4 text-mist-400 transition-transform", showRounds && "rotate-180")} />
            </button>
            {showRounds && (
              <ul className="grid gap-1 border-t border-white/6 px-4 py-3">
                {rounds.map((round) => {
                  const value = r.rounds[round.key] ?? r.bestOf;
                  return (
                    <li key={round.key} className="flex flex-wrap items-center justify-between gap-3 py-1.5">
                      <span className="text-sm text-mist-200">{round.label}</span>
                      <span className="flex gap-1">
                        {BEST_OF.map((option) => (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={value === option}
                            aria-label={`${round.label}: best of ${option}`}
                            onClick={() => {
                              const next = { ...r.rounds };
                              if (option === r.bestOf) delete next[round.key];
                              else next[round.key] = option;
                              update("rules", { rounds: next });
                            }}
                            className={cn(
                              "h-8 min-w-11 rounded-lg px-2 text-xs font-semibold tabular-nums ring-1 ring-inset transition-colors",
                              value === option ? "bg-lavender-400/12 text-mist-50 ring-lavender-400/70" : "text-mist-400 ring-white/10 hover:text-mist-100",
                            )}
                          >
                            Bo{option}
                          </button>
                        ))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </StepSection>

      {f.format === "single_elimination" && (
        <StepSection title="Placement">
          <Switch
            label="Third-place match"
            description="The semifinal losers play for third. Off means they share it."
            checked={r.thirdPlaceMatch}
            onChange={(thirdPlaceMatch) => update("rules", { thirdPlaceMatch })}
          />
        </StepSection>
      )}

      {f.format === "double_elimination" && (
        <StepSection title="Grand final">
          <OptionCards
            legend="How the final is played"
            columns={3}
            value={r.grandFinalMode}
            onChange={(grandFinalMode) => update("rules", { grandFinalMode })}
            options={[
              { value: "single", label: "Single series", description: "One series decides it" },
              { value: "extended_series", label: "Longer series", description: "Two games longer than usual" },
              { value: "reset", label: "Bracket reset", description: "The lower-bracket finalist must win twice" },
            ]}
          />
        </StepSection>
      )}

      {!elimination && (
        <StepSection title="Points and ties">
          <div className="grid grid-cols-3 gap-3 sm:max-w-md">
            {(["win", "draw", "loss"] as const).map((key) => (
              <TextField
                key={key}
                id={`points-${key}`}
                label={`${key[0].toUpperCase()}${key.slice(1)}`}
                inputMode="numeric"
                value={String(r[key])}
                onChange={(event) => update("rules", { [key]: Number(event.target.value.replace(/\D/g, "")) || 0 })}
              />
            ))}
          </div>
          <Switch
            label="Allow draws"
            description="A series can end level, for example 1–1 in a best of 2."
            checked={r.allowDraws}
            onChange={(allowDraws) => update("rules", { allowDraws })}
          />
          <div className="grid gap-3">
            <p className="text-sm font-medium text-mist-200">Tiebreakers, in order</p>
            <ol className="grid gap-2">
              {r.tiebreakers.map((item, index) => (
                <li key={item} className="flex items-center gap-3 rounded-xl bg-white/4 px-3 py-2 ring-1 ring-inset ring-white/8">
                  <span className="grid size-6 place-items-center rounded-full bg-lavender-400/14 text-xs font-semibold text-lavender-300">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm">{TIEBREAKER_LABELS[item]}</span>
                  {[
                    [-1, "arrowUp", "up"],
                    [1, "arrowDown", "down"],
                  ].map(([delta, icon, word]) => (
                    <button
                      key={word as string}
                      type="button"
                      aria-label={`Move ${TIEBREAKER_LABELS[item]} ${word}`}
                      disabled={delta === -1 ? index === 0 : index === r.tiebreakers.length - 1}
                      onClick={() => moveTiebreaker(index, delta as number)}
                      className="grid size-8 place-items-center rounded-lg text-mist-400 transition-colors hover:bg-white/6 hover:text-mist-50 disabled:opacity-30"
                    >
                      <Icon name={icon as "arrowUp" | "arrowDown"} className="size-3.5" />
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label={`Remove ${TIEBREAKER_LABELS[item]}`}
                    onClick={() => toggleTiebreaker(item)}
                    className="grid size-8 place-items-center rounded-lg text-mist-500 transition-colors hover:bg-white/6 hover:text-danger"
                  >
                    <Icon name="close" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ol>
            {allTiebreakers.some((item) => !r.tiebreakers.includes(item)) && (
              <div className="flex flex-wrap gap-2">
                {allTiebreakers
                  .filter((item) => !r.tiebreakers.includes(item))
                  .map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleTiebreaker(item)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-mist-300 ring-1 ring-inset ring-white/12 hover:text-mist-50"
                    >
                      <Icon name="plus" className="size-3" />
                      {TIEBREAKER_LABELS[item]}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </StepSection>
      )}

      <StepSection title="Timers" description="Gamerie runs these automatically, so you don't have to chase anyone.">
        <ChipRow
          legend="No-show"
          hint="A side not ready by then forfeits"
          options={[5, 10, 15, 20, 30, 45, 60]}
          value={r.noShowMinutes}
          format={minutesLabel}
          onChange={(noShowMinutes) => update("rules", { noShowMinutes })}
        />
        <ChipRow
          legend="Report window"
          hint="Time to report a declared score"
          options={[15, 30, 60, 120, 240, 720, 1440]}
          value={r.reportWindowMinutes}
          format={minutesLabel}
          onChange={(reportWindowMinutes) => update("rules", { reportWindowMinutes })}
        />
        <ChipRow
          legend="Replay deadline"
          hint="When an admin orders a replay"
          options={[60, 180, 360, 720, 1440, 2880, 4320, 10080]}
          value={r.replayDeadlineMinutes}
          format={minutesLabel}
          onChange={(replayDeadlineMinutes) => update("rules", { replayDeadlineMinutes })}
        />
      </StepSection>

      <StepSection title="House rules" description="Map pool, game settings, lobby setup. Gamerie's platform rules always apply.">
        <TextAreaField
          id="rules-text"
          label="Your rules (optional)"
          maxLength={10000}
          value={r.rulesText}
          onChange={(event) => update("rules", { rulesText: event.target.value })}
          error={errors.rulesText}
          className="min-h-40"
        />
      </StepSection>
    </div>
  );
}
