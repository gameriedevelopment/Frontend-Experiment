import { TextField } from "@/components/ui/Field";
import { OptionCards } from "@/components/ui/OptionCards";
import { cn } from "@/lib/cn";
import { BRACKET_SIZES, previewFormat } from "../draftForm";
import type { StepProps } from "../stepTypes";
import { ChipRow, LockedNote, StepSection } from "./StepParts";

/** The bracket drawn as rounds of dots, so the host sees the shape they're choosing. */
function ShapePreview({ form }: Pick<StepProps, "form">) {
  const preview = previewFormat(form.format, form.rules);
  return (
    <div className="grid gap-4 rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">
          {preview.totalMatches} {preview.totalMatches === 1 ? "match" : "matches"} in total
        </p>
        <p className="text-xs text-mist-400">
          Everyone plays at least {preview.guaranteed} {preview.guaranteed === 1 ? "match" : "matches"}
        </p>
      </div>
      {preview.groups ? (
        <div className="flex flex-wrap gap-2">
          {preview.groups.map((size, index) => (
            <span key={index} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-mist-300 ring-1 ring-inset ring-white/8">
              Group {String.fromCharCode(65 + index)} · {size} entrants
            </span>
          ))}
        </div>
      ) : (
        preview.lanes.map((lane) => (
          <div key={lane.title} className="grid gap-2">
            {preview.lanes.length > 1 && <p className="type-label text-mist-500">{lane.title}</p>}
            <div className="relative flex items-end gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {lane.rounds.map((round) => (
                <div key={round.key} className="grid min-w-16 justify-items-center gap-1.5">
                  <div className="flex max-h-24 flex-col flex-wrap content-center gap-1">
                    {Array.from({ length: Math.min(round.matches, 16) }, (_, index) => (
                      <span key={index} className="h-1.5 w-5 rounded-full bg-lavender-400/60" />
                    ))}
                  </div>
                  <span className="max-w-20 truncate text-center text-[0.65rem] text-mist-400">{round.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function FormatStep({ form, update, errors, locked }: StepProps) {
  const f = form.format;
  const team = f.entrantType === "team";
  const groupOptions = [1, 2, 4, 8].filter((count) => count * 2 <= f.bracketSize);

  return (
    <div className="grid gap-7">
      <StepSection title="Entrants">
        <OptionCards
          legend="Who competes"
          value={f.entrantType}
          onChange={(entrantType) => update("format", { entrantType })}
          disabled={locked.has("entrantType")}
          options={[
            { value: "player", label: "Players", description: "Each entrant is one player", icon: "user" },
            { value: "team", label: "Teams", description: "Team leaders enter a roster", icon: "team" },
          ]}
        />
        {locked.has("entrantType") && <LockedNote>Fixed once entrants have registered.</LockedNote>}
        {team && (
          <div className="grid gap-6 sm:grid-cols-2">
            <ChipRow
              legend="Players per team"
              hint="Starters in every match"
              options={[1, 2, 3, 4, 5, 6]}
              value={f.teamSize}
              onChange={(teamSize) => update("format", { teamSize })}
            />
            <ChipRow
              legend="Substitutes"
              hint="Extras per roster"
              options={[0, 1, 2, 3, 4, 5]}
              value={f.substitutes}
              onChange={(substitutes) => update("format", { substitutes })}
            />
          </div>
        )}
      </StepSection>

      <StepSection title="Format">
        <OptionCards
          legend="Bracket"
          columns={3}
          value={f.format}
          onChange={(format) => update("format", { format })}
          options={[
            { value: "single_elimination", label: "Single elimination", description: "Lose once and you're out" },
            { value: "double_elimination", label: "Double elimination", description: "A second life in the lower bracket" },
            { value: "round_robin", label: "Round robin", description: "Everyone in a group plays everyone" },
          ]}
        />
        <ChipRow
          legend={f.format === "round_robin" ? "Field size" : "Bracket size"}
          hint="Maximum entrants"
          options={BRACKET_SIZES}
          value={f.bracketSize}
          disabled={locked.has("bracketSize")}
          onChange={(bracketSize) =>
            update("format", {
              bracketSize,
              minEntrants: Math.min(f.minEntrants, bracketSize),
              groupCount: Math.min(f.groupCount, Math.max(1, bracketSize / 2)),
            })
          }
        />
        {f.format === "round_robin" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <ChipRow
              legend="Groups"
              hint="Seeds spread in snake order"
              options={groupOptions}
              value={f.groupCount}
              onChange={(groupCount) => update("format", { groupCount })}
              error={errors.groupCount}
            />
            <ChipRow
              legend="Legs"
              options={["Single", "Double"]}
              value={f.doubleRoundRobin ? "Double" : "Single"}
              onChange={(legs) => update("format", { doubleRoundRobin: legs === "Double" })}
            />
          </div>
        )}
        <ShapePreview form={form} />
      </StepSection>

      <StepSection title="Starting the bracket">
        <div className="grid gap-6 sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start">
          <TextField
            id="min-entrants"
            label="Minimum to start"
            inputMode="numeric"
            value={String(f.minEntrants)}
            onChange={(event) => update("format", { minEntrants: Number(event.target.value.replace(/\D/g, "")) || 0 })}
            error={errors.minEntrants}
          />
          <p className={cn("text-sm leading-relaxed text-mist-400 sm:pt-8")}>
            If fewer check in, you choose to start anyway, delay or cancel.
          </p>
        </div>
        <OptionCards
          legend="Seeding"
          value={f.seedingMethod}
          onChange={(seedingMethod) => update("format", { seedingMethod })}
          options={[
            { value: "random", label: "Random", description: "Shuffled when the bracket is drawn" },
            { value: "manual", label: "Manual", description: "You set the order before the start" },
          ]}
        />
      </StepSection>
    </div>
  );
}
