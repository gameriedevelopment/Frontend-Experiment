import { useMemo, useState, type ReactNode } from "react";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { OptionCards } from "@/components/ui/OptionCards";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { Switch } from "@/components/ui/Switch";
import { TagInput } from "@/components/ui/TagInput";
import { useGame, useGameOptions } from "@/features/games/hooks";
import { REGIONS } from "@/features/tournaments/create/draftForm";
import { ChipRow, StepSection } from "@/features/tournaments/create/steps/StepParts";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { LadderHostingOptions } from "../types";
import { formatLadderDateRange, formatLadderMoney, LADDER_JOIN_LABELS, ladderPlayScopeLabel } from "../utils";
import type { LadderDraftForm, LadderFormErrors } from "./draft";

type Update = <K extends keyof LadderDraftForm>(section: K, patch: Partial<LadderDraftForm[K]>) => void;
interface StepProps {
  form: LadderDraftForm;
  errors: LadderFormErrors;
  update: Update;
}

// The draft keeps local "YYYY-MM-DDTHH:mm" strings; the picker works in ISO.
const toLocal = (iso: string) => {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const toIso = (local: string) => (local ? new Date(local).toISOString() : "");

export function IdentityStep({ form, errors, update, hosting }: StepProps & { hosting: LadderHostingOptions }) {
  const b = form.basics;
  const [query, setQuery] = useState("");
  const games = useGameOptions(useDebouncedValue(query), true);
  const game = useGame(b.gameId || undefined);
  const hosts = [hosting.user, ...hosting.teams, ...hosting.hubs];
  const options = useMemo<ComboboxOption[]>(() => (games.data?.data ?? []).map((item) => ({ value: item.id, label: item.name, description: item.gameType })), [games.data]);
  const platforms = game.data?.platforms ?? [];

  return (
    <div className="grid gap-7">
      <StepSection title="Host" description="Personal and team ladders count toward your active ladder limit. Hubs can run more.">
        <OptionCards
          legend="Hosted by"
          columns={hosts.length > 2 ? 3 : 2}
          value={`${b.hostType}:${b.hostId ?? ""}`}
          onChange={(value) => {
            const [hostType, hostId] = value.split(":");
            update("basics", { hostType: hostType as "user" | "team" | "hub", hostId });
          }}
          options={hosts.map((host) => ({
            value: `${host.type}:${host.id}`,
            label: host.name,
            description: host.type === "user" ? "Under your name" : host.type === "team" ? "For your team" : "For your hub",
            icon: host.type === "user" ? "user" : host.type === "team" ? "team" : "hub",
            disabled: host.type !== "hub" && !hosting.canCreateUserOrTeamLadder,
          }))}
        />
      </StepSection>
      <StepSection title="The ladder">
        <TextField id="ladder-name" label="Name" maxLength={80} value={b.name} onChange={(event) => update("basics", { name: event.target.value })} placeholder="Denver Winter Ladder" error={errors.name} />
        <Combobox
              browse
              browseLabel="Popular games"
          id="ladder-game"
          label="Game"
          placeholder="Search games"
          query={query}
          onQueryChange={setQuery}
          options={options}
          loading={games.isFetching}
          value={b.gameId ? { value: b.gameId, label: game.data?.name ?? "Selected game" } : null}
          onChange={(option) => update("basics", { gameId: option?.value ?? "", platform: "" })}
          error={errors.gameId}
        />
        {b.gameId &&
          (platforms.length ? (
            <ChoiceGroup legend="Platform" columns={3} error={errors.platform}>
              {platforms.map((platform) => (
                <ChoiceChip key={platform} name="ladder-platform" value={platform} checked={b.platform === platform} onChange={() => update("basics", { platform })} label={platform} />
              ))}
            </ChoiceGroup>
          ) : (
            <TextField id="ladder-platform" label="Platform" value={b.platform} onChange={(event) => update("basics", { platform: event.target.value })} placeholder="PC" error={errors.platform} />
          ))}
        <ChoiceGroup legend="Region (optional)" columns={4}>
          {REGIONS.map((region) => (
            <ChoiceChip key={region} name="ladder-region" value={region} checked={b.region === region} onChange={() => update("basics", { region })} label={region} />
          ))}
        </ChoiceGroup>
        <TextAreaField id="ladder-description" label="Description" maxLength={2000} value={b.description ?? ""} onChange={(event) => update("basics", { description: event.target.value })} placeholder="Who it's for, how often people should play, and what's at stake." />
      </StepSection>
    </div>
  );
}

export function CompetitionStep({ form, errors, update }: StepProps) {
  const f = form.format;
  const r = form.rules;
  return (
    <div className="grid gap-7">
      <StepSection title="Entrants">
        <OptionCards
          legend="Who competes"
          value={f.entrantType}
          onChange={(entrantType) => update("format", { entrantType, teamSize: entrantType === "team" ? f.teamSize ?? 5 : undefined })}
          options={[
            { value: "player", label: "Players", description: "Each entrant is one player", icon: "user" },
            { value: "team", label: "Teams", description: "Team leaders enter a roster", icon: "team" },
          ]}
        />
        {f.entrantType === "team" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <ChipRow legend="Starters" options={[1, 2, 3, 4, 5, 6]} value={f.teamSize ?? 5} onChange={(teamSize) => update("format", { teamSize })} error={errors.teamSize} />
            <ChipRow legend="Substitutes" options={[0, 1, 2, 3, 4, 5]} value={f.substitutes ?? 0} onChange={(substitutes) => update("format", { substitutes })} />
          </div>
        )}
      </StepSection>
      <StepSection title="Table" description="One table for everyone, or groups that split the field.">
        <ChipRow legend="Groups" options={[0, 2, 3, 4, 6, 8]} value={f.groupCount} format={(value) => (value === 0 ? "None" : String(value))} onChange={(groupCount) => update("format", { groupCount })} />
        {f.groupCount > 0 && (
          <>
            <OptionCards
              legend="Who goes where"
              value={f.groupAllocation}
              onChange={(groupAllocation) => update("format", { groupAllocation })}
              options={[
                { value: "random", label: "Random", description: "Shuffled when the season starts" },
                { value: "manual", label: "Manual", description: "You place each entrant" },
              ]}
            />
            <OptionCards
              legend="Who can be challenged"
              columns={3}
              value={f.playScope}
              onChange={(playScope) => update("format", { playScope })}
              options={(["own_group", "other_groups", "anyone"] as const).map((value) => ({ value, label: ladderPlayScopeLabel(value) }))}
            />
          </>
        )}
      </StepSection>
      <StepSection title="Scoring">
        <ChipRow legend="Series" options={[1, 3, 5] as const} value={r.bestOf} format={(value) => `Best of ${value}`} onChange={(bestOf) => update("rules", { bestOf })} />
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <TextField id="ladder-win" label="Points for a win" inputMode="numeric" value={String(r.winPoints)} onChange={(event) => update("rules", { winPoints: Number(event.target.value.replace(/\D/g, "")) || 0 })} error={errors.winPoints} />
          <TextField id="ladder-draw" label="Points for a draw" inputMode="numeric" disabled={!r.allowDraws} value={String(r.drawPoints)} onChange={(event) => update("rules", { drawPoints: Number(event.target.value.replace(/\D/g, "")) || 0 })} error={errors.drawPoints} />
        </div>
        <Switch label="Allow draws" description="A series can end level." checked={r.allowDraws} onChange={(allowDraws) => update("rules", { allowDraws })} />
        <ChipRow legend="Rematch wait" hint="Before the same pair can play again" options={[0, 1, 3, 7, 14, 30]} value={r.rematchWaitDays} format={(value) => (value === 0 ? "None" : `${value} d`)} onChange={(rematchWaitDays) => update("rules", { rematchWaitDays })} />
        <ChipRow legend="Matches to place for prizes" options={[0, 3, 5, 10, 15, 20]} value={r.minimumMatchesForPrizes} onChange={(minimumMatchesForPrizes) => update("rules", { minimumMatchesForPrizes })} />
      </StepSection>
      <StepSection title="Rules">
        <TagInput label="Allowed modes" hint="Optional" values={r.allowedModes} onChange={(allowedModes) => update("rules", { allowedModes })} placeholder="Competitive, Unrated…" />
        <TagInput label="Allowed maps" hint="Optional" values={r.allowedMaps} onChange={(allowedMaps) => update("rules", { allowedMaps })} placeholder="Ascent, Bind…" />
        <TextAreaField id="ladder-rules" label="House rules (optional)" maxLength={10000} value={r.rulesText ?? ""} onChange={(event) => update("rules", { rulesText: event.target.value })} />
      </StepSection>
    </div>
  );
}

export function AccessStep({ form, errors, update, hubHost }: StepProps & { hubHost: boolean }) {
  const j = form.joining;
  const s = form.schedule;
  const places = s.prizePlaces;
  return (
    <div className="grid gap-7">
      <StepSection title="Entry">
        <OptionCards
          legend="How entrants join"
          value={j.joinMode}
          onChange={(joinMode) => update("joining", { joinMode })}
          options={[
            { value: "open", label: "Open", description: "Anyone can join", icon: "ticket" },
            { value: "approval", label: "Approval", description: "You approve each entry", icon: "check" },
            { value: "hub_members", label: "Hub members", description: "Only members of the hosting hub", icon: "hub", disabled: !hubHost },
            { value: "private", label: "Private", description: "Only who you invite", icon: "lock" },
          ]}
        />
        <Switch label="Limit entrants" checked={j.maxParticipants != null} onChange={(on) => update("joining", { maxParticipants: on ? 32 : null })} />
        {j.maxParticipants != null && (
          <TextField
            id="ladder-max"
            label="Maximum entrants"
            inputMode="numeric"
            className="sm:max-w-40"
            value={String(j.maxParticipants)}
            onChange={(event) => update("joining", { maxParticipants: Number(event.target.value.replace(/\D/g, "")) || 0 })}
            error={errors.maxParticipants}
          />
        )}
      </StepSection>
      <StepSection title="Season">
        <ScheduleField label="Starts" days={60} value={toIso(s.startsAt)} onChange={(iso) => update("schedule", { startsAt: iso ? toLocal(iso) : "" })} error={errors.startsAt} />
        <ScheduleField label="Ends" days={180} value={toIso(s.endsAt)} onChange={(iso) => update("schedule", { endsAt: iso ? toLocal(iso) : "" })} error={errors.endsAt} />
      </StepSection>
      <StepSection title="Prize">
        <Switch label="This ladder has a prize" description="You pay prizes yourself; Gamerie shows them and the final table." checked={s.prizeEnabled} onChange={(prizeEnabled) => update("schedule", { prizeEnabled })} />
        {s.prizeEnabled && (
          <div className="grid gap-4">
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_6rem] gap-3">
              {places.map((amount, index) => (
                <TextField
                  key={index}
                  id={`ladder-place-${index}`}
                  label={`Place ${index + 1}`}
                  inputMode="decimal"
                  value={amount ? String(amount) : ""}
                  onChange={(event) => update("schedule", { prizePlaces: places.map((value, i) => (i === index ? Number(event.target.value.replace(/[^\d.]/g, "")) || 0 : value)) })}
                />
              ))}
              <TextField id="ladder-currency" label="Currency" maxLength={3} value={s.prizeCurrency} onChange={(event) => update("schedule", { prizeCurrency: event.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} />
            </div>
            {errors.prizePlaces && (
              <p role="alert" className="text-[0.8rem] text-danger">
                {errors.prizePlaces}
              </p>
            )}
            <TextField id="ladder-prize-description" label="How it's paid (optional)" maxLength={200} value={s.prizeDescription} onChange={(event) => update("schedule", { prizeDescription: event.target.value })} />
          </div>
        )}
      </StepSection>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 text-sm">
      <dt className="text-mist-500">{label}</dt>
      <dd className="text-mist-100">{value}</dd>
    </div>
  );
}

export function ReviewStep({ form, gameName, hostName, onEdit }: { form: LadderDraftForm; gameName: string; hostName: string; onEdit: (step: "basics" | "competition" | "access") => void }) {
  const total = form.schedule.prizePlaces.reduce((sum, value) => sum + value, 0);
  const blocks: Array<[string, "basics" | "competition" | "access", Array<[string, ReactNode]>]> = [
    [
      "Identity",
      "basics",
      [
        ["Name", form.basics.name || "Not set"],
        ["Host", hostName],
        ["Game", `${gameName || "Not set"}${form.basics.platform ? ` · ${form.basics.platform}` : ""}`],
        ["Region", form.basics.region || "Any"],
      ],
    ],
    [
      "Competition",
      "competition",
      [
        ["Entrants", form.format.entrantType === "team" ? `Teams of ${form.format.teamSize}` : "Players"],
        ["Table", form.format.groupCount ? `${form.format.groupCount} groups · ${ladderPlayScopeLabel(form.format.playScope)}` : "One table"],
        ["Scoring", `Bo${form.rules.bestOf} · win ${form.rules.winPoints}${form.rules.allowDraws ? ` · draw ${form.rules.drawPoints}` : ""}`],
        ["Rematches", form.rules.rematchWaitDays ? `After ${form.rules.rematchWaitDays} days` : "Any time"],
      ],
    ],
    [
      "Access and season",
      "access",
      [
        ["Entry", LADDER_JOIN_LABELS[form.joining.joinMode]],
        ["Limit", form.joining.maxParticipants ?? "No limit"],
        ["Season", formatLadderDateRange(toIso(form.schedule.startsAt), toIso(form.schedule.endsAt))],
        ["Prize", form.schedule.prizeEnabled && total ? formatLadderMoney(total, form.schedule.prizeCurrency || "USD") : "No prize"],
      ],
    ],
  ];
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {blocks.map(([title, step, rows]) => (
        <section key={title} className="rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/6 sm:p-5">
          <header className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{title}</h3>
            <button type="button" onClick={() => onEdit(step)} className="text-sm font-medium text-lavender-300 hover:text-lavender-200">
              Edit
            </button>
          </header>
          <dl className="grid gap-2.5">
            {rows.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
