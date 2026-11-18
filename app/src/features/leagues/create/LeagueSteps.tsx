import { useMemo, useState, type ReactNode } from "react";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OptionCards } from "@/components/ui/OptionCards";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { Switch } from "@/components/ui/Switch";
import { TagInput } from "@/components/ui/TagInput";
import { TimeZoneField } from "@/components/ui/TimeZoneField";
import { useGame, useGameOptions } from "@/features/games/hooks";
import { LadderCoverDrop, LadderLogoDrop } from "@/features/ladders/create/LadderSteps";
import { REGIONS } from "@/features/tournaments/create/draftForm";
import { ChipRow, StepSection } from "@/features/tournaments/create/steps/StepParts";
import { cn } from "@/lib/cn";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { LeagueHostingOptions, LeagueTiebreaker } from "../types";
import {
  LEAGUE_JOIN_LABELS,
  LEAGUE_TIEBREAKER_LABELS,
  WEEKDAYS,
  formatLeagueDateRange,
  formatLeagueMoney,
  leaguePlayScopeLabel,
  leaguePlayoffLabel,
} from "../utils";
import { weeksAvailable, weeksNeeded, type LeagueDraftForm, type LeagueFormErrors, type LeagueStep } from "./draft";

type Update = <K extends keyof LeagueDraftForm>(section: K, patch: Partial<LeagueDraftForm[K]>) => void;
interface StepProps {
  form: LeagueDraftForm;
  errors: LeagueFormErrors;
  update: Update;
}

// The draft keeps local "YYYY-MM-DDTHH:mm" strings; the picker works in ISO.
const toLocal = (iso: string) => {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const toIso = (local: string) => (local ? new Date(local).toISOString() : "");
const digits = (value: string) => Number(value.replace(/\D/g, "")) || 0;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-1.5 text-[0.8rem] text-danger">
      <Icon name="warning" className="mt-0.5 size-3.5 shrink-0" weight="bold" />
      {message}
    </p>
  );
}

export function BasicsStep({
  form,
  errors,
  update,
  hosting,
  cover,
  onCover,
  logo,
  onLogo,
  hostLocked,
}: StepProps & {
  hosting: LeagueHostingOptions;
  cover: { file: File | null; url: string | null };
  onCover: (file: File | null) => void;
  logo: { file: File | null; url: string | null };
  onLogo: (file: File | null) => void;
  hostLocked: boolean;
}) {
  const b = form.basics;
  const [query, setQuery] = useState("");
  const games = useGameOptions(useDebouncedValue(query), true);
  const game = useGame(b.gameId || undefined);
  const options = useMemo<ComboboxOption[]>(() => (games.data?.data ?? []).map((item) => ({ value: item.id, label: item.name, description: item.gameType })), [games.data]);
  const platforms = game.data?.platforms ?? [];

  return (
    <div className="grid gap-7">
      <StepSection title="Host" description="Leagues run from a hub. Its owners, admins and managers can all manage the league.">
        {hostLocked ? (
          <p className="text-sm text-mist-300">
            Run by <span className="font-semibold text-mist-50">{hosting.hubs.find((hub) => hub.id === b.hubId)?.name ?? "your hub"}</span>. The host can't change once a league exists.
          </p>
        ) : (
          <OptionCards
            legend="Hosted by"
            columns={hosting.hubs.length > 2 ? 3 : 2}
            value={b.hubId ?? ""}
            onChange={(hubId) => update("basics", { hubId })}
            options={hosting.hubs.map((hub) => ({ value: hub.id, label: hub.name, description: "Your hub", icon: "hub" as const }))}
            error={errors.hubId}
          />
        )}
      </StepSection>
      <StepSection title="The league">
        <TextField id="league-name" label="Name" maxLength={100} value={b.name} onChange={(event) => update("basics", { name: event.target.value })} placeholder="Northside Premier League" error={errors.name} />
        <Combobox
          browse
          browseLabel="Popular games"
          id="league-game"
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
                <ChoiceChip key={platform} name="league-platform" value={platform} checked={b.platform === platform} onChange={() => update("basics", { platform })} label={platform} />
              ))}
            </ChoiceGroup>
          ) : (
            <TextField id="league-platform" label="Platform" value={b.platform} onChange={(event) => update("basics", { platform: event.target.value })} placeholder="PC" error={errors.platform} />
          ))}
        <ChoiceGroup legend="Region (optional)" columns={4}>
          {REGIONS.map((region) => (
            <ChoiceChip key={region} name="league-region" value={region} checked={b.region === region} onChange={() => update("basics", { region })} label={region} />
          ))}
        </ChoiceGroup>
        <TextAreaField id="league-description" label="Description" maxLength={4000} value={b.description ?? ""} onChange={(event) => update("basics", { description: event.target.value })} placeholder="Who it's for, the level you expect and what's at stake." />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <LadderCoverDrop file={cover.file} url={cover.url} onFile={onCover} />
          <LadderLogoDrop file={logo.file} url={logo.url} onFile={onLogo} />
        </div>
      </StepSection>
    </div>
  );
}

export function FormatStep({ form, errors, update }: StepProps) {
  const f = form.format;
  const p = form.playoffs;
  return (
    <div className="grid gap-7">
      <StepSection title="Entrants">
        <OptionCards
          legend="Who competes"
          value={f.entrantType}
          onChange={(entrantType) => update("format", { entrantType, teamSize: entrantType === "team" ? (f.teamSize ?? 5) : undefined })}
          options={[
            { value: "team", label: "Teams", description: "Team leaders enter a roster", icon: "team" },
            { value: "player", label: "Players", description: "Each entrant is one player", icon: "user" },
          ]}
        />
        {f.entrantType === "team" && (
          <div className="grid gap-6 sm:grid-cols-2">
            <ChipRow legend="Starters" options={[1, 2, 3, 4, 5, 6]} value={f.teamSize ?? 5} onChange={(teamSize) => update("format", { teamSize })} error={errors.teamSize} />
            <ChipRow legend="Substitutes" options={[0, 1, 2, 3, 4, 5]} value={f.substitutes ?? 0} onChange={(substitutes) => update("format", { substitutes })} />
          </div>
        )}
      </StepSection>
      <StepSection title="Regular season" description="Everyone in a table plays each other once, or home and away twice.">
        <OptionCards
          legend="Round robin"
          value={f.format}
          onChange={(format) => update("format", { format })}
          options={[
            { value: "single", label: "Single", description: "Play each opponent once" },
            { value: "double", label: "Double", description: "Play each opponent twice" },
          ]}
        />
        <ChipRow legend="Groups" options={[0, 2, 3, 4, 6, 8]} value={f.groupCount} format={(value) => (value === 0 ? "None" : String(value))} onChange={(groupCount) => update("format", { groupCount, playScope: groupCount ? f.playScope : "anyone" })} />
        {f.groupCount > 0 && (
          <>
            <OptionCards
              legend="Who goes where"
              value={f.groupAllocation}
              onChange={(groupAllocation) => update("format", { groupAllocation })}
              options={[
                { value: "random", label: "Random", description: "Shuffled when the season starts, spread across hubs" },
                { value: "manual", label: "Manual", description: "You place each entrant" },
              ]}
            />
            <OptionCards
              legend="Who plays whom"
              columns={3}
              value={f.playScope}
              onChange={(playScope) => update("format", { playScope })}
              options={(["own_group", "other_groups", "anyone"] as const).map((value) => ({ value, label: leaguePlayScopeLabel(value) }))}
            />
          </>
        )}
      </StepSection>
      <StepSection title="Playoffs" description="The top of the table plays a bracket after the regular season to decide the champion.">
        <ChipRow
          legend="Playoff spots"
          options={[0, 2, 4, 8, 16]}
          value={p.size ?? 0}
          format={(value) => (value === 0 ? "None" : `Top ${value}`)}
          onChange={(size) => update("playoffs", { size: size || null, format: size ? (p.format ?? "single_elimination") : null })}
        />
        {Boolean(p.size) && (
          <OptionCards
            legend="Bracket"
            value={p.format ?? "single_elimination"}
            onChange={(format) => update("playoffs", { format })}
            options={[
              { value: "single_elimination", label: "Single elimination", description: "Lose once and you're out" },
              { value: "double_elimination", label: "Double elimination", description: "A second chance through the lower bracket" },
            ]}
          />
        )}
        <FieldError message={errors.playoffs} />
      </StepSection>
    </div>
  );
}

export function ScheduleStep({ form, errors, update, startLocked }: StepProps & { startLocked?: boolean }) {
  const s = form.schedule;
  const weeks = weeksAvailable(form);
  return (
    <div className="grid gap-7">
      <StepSection title="Season dates" description="Between 6 weeks and 6 months. One round of matches is played each week.">
        <ScheduleField label="Starts" days={120} disabled={startLocked} value={toIso(s.startsAt)} onChange={(iso) => update("schedule", { startsAt: iso ? toLocal(iso) : "" })} error={errors.startsAt} />
        <ScheduleField label="Ends" days={320} value={toIso(s.endsAt)} onChange={(iso) => update("schedule", { endsAt: iso ? toLocal(iso) : "" })} error={errors.endsAt} />
        {weeks > 0 && (
          <p className="flex items-center gap-2 text-sm text-mist-300">
            <Icon name="calendar" className="size-4 text-lavender-300" />
            {weeks} match {weeks === 1 ? "week" : "weeks"} in this season
          </p>
        )}
      </StepSection>
      <StepSection title="Match night" description="Every match gets this default slot. Opponents can agree another time in the same week.">
        <ChipRow legend="Weeks start on" options={[0, 1, 2, 3, 4, 5, 6]} value={s.weekStartDay} format={(value) => WEEKDAYS[value].slice(0, 3)} onChange={(weekStartDay) => update("schedule", { weekStartDay })} />
        <ChipRow legend="Match day" options={[0, 1, 2, 3, 4, 5, 6]} value={s.matchDay} format={(value) => WEEKDAYS[value].slice(0, 3)} onChange={(matchDay) => update("schedule", { matchDay })} />
        <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <TextField id="league-match-time" label="Match time" type="time" value={s.matchTime} onChange={(event) => update("schedule", { matchTime: event.target.value })} error={errors.matchTime} />
          <TimeZoneField id="league-time-zone" value={s.timeZone} onChange={(timeZone) => update("schedule", { timeZone })} hint="Match times show in each player's own time." />
        </div>
      </StepSection>
    </div>
  );
}

const TIEBREAKERS: LeagueTiebreaker[] = ["head_to_head", "game_difference", "games_won", "wins"];

export function RulesStep({ form, errors, update, gameModes, scoringLocked }: StepProps & { gameModes: string[]; scoringLocked?: boolean }) {
  const r = form.rules;
  const toggleMode = (mode: string) =>
    update("rules", { allowedModes: r.allowedModes.includes(mode) ? r.allowedModes.filter((item) => item !== mode) : [...r.allowedModes, mode] });
  const moveTiebreaker = (item: LeagueTiebreaker) => {
    const on = r.tiebreakers.includes(item);
    update("rules", { tiebreakers: on ? r.tiebreakers.filter((value) => value !== item) : [...r.tiebreakers, item] });
  };
  return (
    <div className="grid gap-7">
      <StepSection title="Scoring" description={scoringLocked ? "Scoring is locked because the season has started and it decides the table." : undefined}>
        <ChipRow legend="Series" options={[1, 3, 5] as const} value={r.bestOf} format={(value) => `Best of ${value}`} onChange={(bestOf) => update("rules", { bestOf })} disabled={scoringLocked} />
        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
          <TextField id="league-win" label="Win" inputMode="numeric" disabled={scoringLocked} value={String(r.winPoints)} onChange={(event) => update("rules", { winPoints: digits(event.target.value) })} error={errors.winPoints} />
          <TextField id="league-draw" label="Draw" inputMode="numeric" disabled={scoringLocked || !r.allowDraws} value={String(r.drawPoints)} onChange={(event) => update("rules", { drawPoints: digits(event.target.value) })} />
          <TextField id="league-loss" label="Loss" inputMode="numeric" disabled={scoringLocked} value={String(r.lossPoints)} onChange={(event) => update("rules", { lossPoints: digits(event.target.value) })} error={errors.lossPoints} />
        </div>
        <Switch label="Allow draws" description="A series can end level, for example 1–1 in a best of two maps." checked={r.allowDraws} disabled={scoringLocked} onChange={(allowDraws) => update("rules", { allowDraws })} />
      </StepSection>
      <StepSection title="Tiebreakers" description="Applied in this order when teams finish level on points. Tap to add or remove.">
        <ol className="flex flex-wrap gap-2">
          {TIEBREAKERS.map((item) => {
            const position = r.tiebreakers.indexOf(item);
            return (
              <li key={item}>
                <button
                  type="button"
                  aria-pressed={position >= 0}
                  disabled={scoringLocked}
                  onClick={() => moveTiebreaker(item)}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-full px-4 text-sm ring-1 ring-inset transition-colors disabled:opacity-50",
                    position >= 0 ? "bg-lavender-400/12 text-mist-50 ring-lavender-400/60" : "text-mist-400 ring-white/10 hover:text-mist-100",
                  )}
                >
                  {position >= 0 && <span className="grid size-5 place-items-center rounded-full bg-lavender-400 text-[0.7rem] font-bold text-ink-950">{position + 1}</span>}
                  {LEAGUE_TIEBREAKER_LABELS[item]}
                </button>
              </li>
            );
          })}
        </ol>
      </StepSection>
      <StepSection title="Game rules">
        {gameModes.length > 0 && (
          <div className="grid gap-2.5">
            <p className="text-sm font-medium text-mist-100">Allowed modes</p>
            <p className="text-xs text-mist-500">Leave all off to allow every mode.</p>
            <div className="flex flex-wrap gap-2">
              {gameModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={r.allowedModes.includes(mode)}
                  onClick={() => toggleMode(mode)}
                  className={cn(
                    "h-9 rounded-full px-3.5 text-sm ring-1 ring-inset transition-colors",
                    r.allowedModes.includes(mode) ? "bg-lavender-400/12 text-mist-50 ring-lavender-400/60" : "text-mist-400 ring-white/10 hover:text-mist-100",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}
        <TagInput label="Map pool" hint="Optional" values={r.allowedMaps} onChange={(allowedMaps) => update("rules", { allowedMaps })} placeholder="Ascent, Bind…" />
        <TextAreaField id="league-rules" label="House rules (optional)" maxLength={8000} value={r.rulesText ?? ""} onChange={(event) => update("rules", { rulesText: event.target.value })} placeholder="Check-in, pauses, disconnects, how to report a result…" />
      </StepSection>
    </div>
  );
}

export function EntryStep({ form, errors, update }: StepProps) {
  const j = form.joining;
  const p = form.prize;
  const needed = weeksNeeded(form);
  const available = weeksAvailable(form);
  return (
    <div className="grid gap-7">
      <StepSection title="Entry">
        <OptionCards
          legend="How entrants join"
          value={j.joinMode}
          onChange={(joinMode) => update("joining", { joinMode })}
          options={[
            { value: "open", label: "Open", description: "Anyone can enter", icon: "ticket" },
            { value: "approval", label: "Approval", description: "You approve each entry", icon: "check" },
            { value: "hub_members", label: "Hub members", description: "Only members of your hub", icon: "hub" },
            { value: "private", label: "Invite only", description: "Only who you invite", icon: "lock" },
          ]}
        />
        <Switch label="Limit entrants" description="The schedule has to fit a full field before you can publish." checked={j.maxParticipants != null} onChange={(on) => update("joining", { maxParticipants: on ? 8 : null })} />
        {j.maxParticipants != null && (
          <TextField
            id="league-max"
            label="Maximum entrants"
            inputMode="numeric"
            className="sm:max-w-40"
            value={String(j.maxParticipants)}
            onChange={(event) => update("joining", { maxParticipants: digits(event.target.value) })}
            error={errors.maxParticipants}
          />
        )}
        {j.maxParticipants != null && !errors.maxParticipants && needed > 0 && (
          <p className={cn("text-sm", needed > available ? "text-danger" : "text-mist-400")}>
            A full field plays {needed} match weeks{form.playoffs.size ? ", playoffs included" : ""}. This season has {available}.
          </p>
        )}
        {form.format.entrantType === "team" && (
          <ChipRow legend="Roster additions per week" hint="New players a team can add once the season starts" options={[0, 1, 2, 3]} value={j.rosterChangesPerWeek} format={(value) => (value === 0 ? "None" : String(value))} onChange={(rosterChangesPerWeek) => update("joining", { rosterChangesPerWeek })} />
        )}
      </StepSection>
      <StepSection title="Prize">
        <Switch label="This season has a prize" description="Your hub pays prizes; Gamerie shows them and the final table." checked={p.enabled} onChange={(enabled) => update("prize", { enabled })} />
        {p.enabled && (
          <div className="grid gap-4">
            <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_6rem] gap-3">
              {p.places.map((amount, index) => (
                <TextField
                  key={index}
                  id={`league-place-${index}`}
                  label={`Place ${index + 1}`}
                  inputMode="decimal"
                  value={amount ? String(amount) : ""}
                  onChange={(event) => update("prize", { places: p.places.map((value, i) => (i === index ? Number(event.target.value.replace(/[^\d.]/g, "")) || 0 : value)) })}
                />
              ))}
              <TextField id="league-currency" label="Currency" maxLength={3} value={p.currency} onChange={(event) => update("prize", { currency: event.target.value.toUpperCase().replace(/[^A-Z]/g, "") })} />
            </div>
            <FieldError message={errors.prize} />
            <TextField id="league-prize-description" label="How it's paid (optional)" maxLength={200} value={p.description} onChange={(event) => update("prize", { description: event.target.value })} />
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
      <dd className="min-w-0 break-words text-mist-100">{value}</dd>
    </div>
  );
}

export function ReviewStep({ form, gameName, hostName, onEdit }: { form: LeagueDraftForm; gameName: string; hostName: string; onEdit: (step: Exclude<LeagueStep, "review">) => void }) {
  const total = form.prize.places.reduce((sum, value) => sum + value, 0);
  const s = form.schedule;
  const blocks: Array<[string, Exclude<LeagueStep, "review">, Array<[string, ReactNode]>]> = [
    ["Basics", "basics", [["Name", form.basics.name || "Not set"], ["Host", hostName], ["Game", `${gameName || "Not set"}${form.basics.platform ? ` · ${form.basics.platform}` : ""}`], ["Region", form.basics.region || "Any"]]],
    [
      "Format",
      "format",
      [
        ["Entrants", form.format.entrantType === "team" ? `Teams of ${form.format.teamSize}${form.format.substitutes ? ` + ${form.format.substitutes} subs` : ""}` : "Players"],
        ["Season", `${form.format.format === "double" ? "Double" : "Single"} round robin`],
        ["Table", form.format.groupCount ? `${form.format.groupCount} groups · ${leaguePlayScopeLabel(form.format.playScope)}` : "One table"],
        ["Playoffs", leaguePlayoffLabel(form.playoffs.size ? { size: form.playoffs.size, format: form.playoffs.format } : null)],
      ],
    ],
    [
      "Schedule",
      "schedule",
      [
        ["Dates", formatLeagueDateRange(toIso(s.startsAt), toIso(s.endsAt))],
        ["Match night", `${WEEKDAYS[s.matchDay]}s at ${s.matchTime}`],
        ["Time zone", s.timeZone],
      ],
    ],
    [
      "Rules",
      "rules",
      [
        ["Scoring", `Bo${form.rules.bestOf} · W ${form.rules.winPoints}${form.rules.allowDraws ? ` · D ${form.rules.drawPoints}` : ""} · L ${form.rules.lossPoints}`],
        ["Tiebreakers", form.rules.tiebreakers.map((item) => LEAGUE_TIEBREAKER_LABELS[item]).join(", ") || "Default"],
        ["Modes", form.rules.allowedModes.join(", ") || "All"],
      ],
    ],
    [
      "Entry & prizes",
      "entry",
      [
        ["Entry", LEAGUE_JOIN_LABELS[form.joining.joinMode]],
        ["Limit", form.joining.maxParticipants ?? "No limit"],
        ["Prize", form.prize.enabled && total ? formatLeagueMoney(total, form.prize.currency || "USD") : "No prize"],
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
