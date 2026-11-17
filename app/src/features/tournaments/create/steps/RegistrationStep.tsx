import { useState } from "react";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OptionCards } from "@/components/ui/OptionCards";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { cn } from "@/lib/cn";
import { fromLocalInput, toLocalInput } from "../../utils";
import { REGIONS } from "../draftForm";
import type { StepProps } from "../stepTypes";
import { ChipRow, StepSection, minutesLabel } from "./StepParts";

const opens = [15, 30, 45, 60, 90, 120, 240, 720, 1440];
const closes = [0, 5, 10, 15, 20, 30, 60];

export function RegistrationStep({ form, update, errors }: StepProps) {
  const r = form.registration;
  const team = form.format.entrantType === "team";
  const restricted = Boolean(r.regions.length || r.minRankingScore || r.maxRankingScore || r.minRosterSize);
  const [showEligibility, setShowEligibility] = useState(restricted);

  return (
    <div className="grid gap-7">
      <StepSection title="Entry">
        <OptionCards
          legend="How entrants join"
          columns={3}
          value={r.registrationMode}
          onChange={(registrationMode) => update("registration", { registrationMode })}
          options={[
            { value: "open", label: "Open", description: "First come, first in", icon: "ticket" },
            { value: "approval", label: "Approval", description: "You approve each entry", icon: "check" },
            { value: "invite", label: "Invite only", description: "Only who you invite", icon: "mail" },
          ]}
        />
        <ScheduleField
          label="Entries close"
          days={60}
          value={fromLocalInput(r.registrationClosesAt) ?? ""}
          onChange={(iso) => update("registration", { registrationClosesAt: iso ? toLocalInput(iso) : "" })}
          error={errors.registrationClosesAt}
        />
      </StepSection>

      <StepSection title="Check-in" description="Entrants confirm they'll play. Anyone who misses it is dropped before the bracket is drawn.">
        <ChipRow
          legend="Opens before the start"
          options={opens}
          value={r.checkInOpensMinutesBefore}
          format={minutesLabel}
          onChange={(checkInOpensMinutesBefore) => update("registration", { checkInOpensMinutesBefore })}
        />
        <ChipRow
          legend="Closes before the start"
          options={closes}
          value={r.checkInClosesMinutesBefore}
          format={(value) => (value === 0 ? "At start" : minutesLabel(value))}
          onChange={(checkInClosesMinutesBefore) => update("registration", { checkInClosesMinutesBefore })}
          error={errors.checkInClosesMinutesBefore}
        />
      </StepSection>

      <section className="rounded-2xl bg-white/3 ring-1 ring-inset ring-white/6">
        <button
          type="button"
          aria-expanded={showEligibility}
          onClick={() => setShowEligibility((value) => !value)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
        >
          <span>
            <span className="block text-sm font-semibold">Restrict who can enter</span>
            <span className="mt-0.5 block text-xs text-mist-400">
              {restricted ? "Restrictions are on." : "Optional. By default anyone on Gamerie can enter."}
            </span>
          </span>
          <Icon name="chevronDown" className={cn("size-4 shrink-0 text-mist-400 transition-transform", showEligibility && "rotate-180")} />
        </button>
        {showEligibility && (
          <div className="grid gap-6 border-t border-white/6 px-4 py-5">
            <ChoiceGroup legend="Regions" hint="None selected means everywhere" columns={4}>
              {REGIONS.filter((region) => region !== "Global").map((region) => (
                <ChoiceChip
                  key={region}
                  multiple
                  name="eligible-regions"
                  value={region}
                  checked={r.regions.includes(region)}
                  onChange={() =>
                    update("registration", {
                      regions: r.regions.includes(region) ? r.regions.filter((item) => item !== region) : [...r.regions, region],
                    })
                  }
                  label={region}
                />
              ))}
            </ChoiceGroup>
            <div className={cn("grid gap-4", team ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
              <TextField
                id="min-skill"
                label="Minimum skill score"
                inputMode="numeric"
                placeholder="Any"
                value={r.minRankingScore}
                onChange={(event) => update("registration", { minRankingScore: event.target.value.replace(/\D/g, "") })}
                error={errors.minRankingScore}
              />
              <TextField
                id="max-skill"
                label="Maximum skill score"
                inputMode="numeric"
                placeholder="Any"
                value={r.maxRankingScore}
                onChange={(event) => update("registration", { maxRankingScore: event.target.value.replace(/\D/g, "") })}
              />
              {team && (
                <TextField
                  id="min-roster"
                  label="Minimum roster"
                  inputMode="numeric"
                  placeholder={String(form.format.teamSize)}
                  value={r.minRosterSize}
                  onChange={(event) => update("registration", { minRosterSize: event.target.value.replace(/\D/g, "") })}
                />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
