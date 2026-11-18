import { useMemo, useState, type ReactNode } from "react";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { FileDrop } from "@/components/ui/FileDrop";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OptionCards } from "@/components/ui/OptionCards";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { TagInput } from "@/components/ui/TagInput";
import { useGame, useGameOptions } from "@/features/games/hooks";
import { REGIONS } from "@/features/tournaments/create/draftForm";
import { ChipRow, StepSection } from "@/features/tournaments/create/steps/StepParts";
import { cn } from "@/lib/cn";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { LadderHostingOptions } from "../types";
import { formatLadderDateRange, formatLadderMoney, formatRematchWait, LADDER_JOIN_LABELS, ladderPlayScopeLabel } from "../utils";
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

const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_COVER_BYTES = 4 * 1024 * 1024;

/** A ladder cover, like a tournament banner. The page uploads it once the draft is saved. */
export function LadderCoverDrop({ file, url, onFile }: { file: File | null; url: string | null; onFile: (file: File | null) => void }) {
  return (
    <FileDrop
      label="Cover image (optional)"
      hint="Shown on the ladder card and page. 16:6, JPG, PNG or WebP, up to 4 MB"
      accept={COVER_TYPES}
      maxBytes={MAX_COVER_BYTES}
      currentUrl={url}
      file={file}
      onFile={onFile}
    />
  );
}

/** A square logo for the ladder, shown next to its name. Uploaded with the cover. */
export function LadderLogoDrop({ file, url, onFile }: { file: File | null; url: string | null; onFile: (file: File | null) => void }) {
  return (
    <FileDrop
      label="Logo (optional)"
      hint="Square, at least 400 × 400. JPG, PNG or WebP, up to 4 MB"
      accept={COVER_TYPES}
      maxBytes={MAX_COVER_BYTES}
      currentUrl={url}
      file={file}
      onFile={onFile}
    />
  );
}

export function IdentityStep({
  form,
  errors,
  update,
  hosting,
  cover,
  onCover,
  logo,
  onLogo,
}: StepProps & {
  hosting: LadderHostingOptions;
  cover: { file: File | null; url: string | null };
  onCover: (file: File | null) => void;
  logo: { file: File | null; url: string | null };
  onLogo: (file: File | null) => void;
}) {
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
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <LadderCoverDrop file={cover.file} url={cover.url} onFile={onCover} />
          <LadderLogoDrop file={logo.file} url={logo.url} onFile={onLogo} />
        </div>
      </StepSection>
    </div>
  );
}

/** A wait typed in hours or days; 0 lets the same pair play again straight away. */
function RematchWaitField({ hours, onChange, error }: { hours: number; onChange: (hours: number) => void; error?: string }) {
  const [unit, setUnit] = useState<"hours" | "days">(hours && hours % 24 === 0 ? "days" : "hours");
  const amount = unit === "days" ? hours / 24 : hours;
  return (
    <div className="grid gap-2.5">
      <div className="flex flex-wrap items-end gap-3">
        <TextField
          id="ladder-rematch"
          label="Rematch wait"
          inputMode="numeric"
          className="w-28"
          value={String(amount)}
          onChange={(event) => {
            const next = Number(event.target.value.replace(/\D/g, "")) || 0;
            onChange(Math.min(720, unit === "days" ? next * 24 : next));
          }}
          error={error}
        />
        <Segmented
          label="Unit"
          value={unit}
          onChange={(next) => {
            setUnit(next);
            onChange(Math.min(720, next === "days" ? Math.round(amount) * 24 : Math.round(amount)));
          }}
          options={[
            { value: "hours", label: "Hours" },
            { value: "days", label: "Days" },
          ]}
          className="mb-0.5"
        />
      </div>
      <p className="text-xs text-mist-500">
        {hours ? `The same pair can play again after ${formatRematchWait(hours)}.` : "No wait: the same pair can play again as soon as a result is final."} Up to 30 days.
      </p>
    </div>
  );
}

/** The selected game's own modes as chips; games without a list take typed modes. */
function ModePicker({ gameId, values, onChange, error }: { gameId: string; values: string[]; onChange: (values: string[]) => void; error?: string }) {
  const game = useGame(gameId || undefined);
  const modes = game.data?.gameModes ?? [];
  if (game.isLoading) return <p className="text-sm text-mist-400">Loading the game's modes…</p>;
  if (!modes.length)
    return (
      <div className="grid gap-1.5">
        <TagInput label="Allowed modes" hint="Required" values={values} onChange={onChange} placeholder="Ranked, 1v1…" />
        <p className="text-xs text-mist-500">{game.data?.name ?? "This game"} doesn't list its modes, so type the ones players can use.</p>
        {error && <p role="alert" className="text-[0.8rem] text-danger">{error}</p>}
      </div>
    );
  const toggle = (mode: string) => onChange(values.includes(mode) ? values.filter((item) => item !== mode) : [...values, mode]);
  const all = modes.every((mode) => values.includes(mode));
  return (
    <div className="grid gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-mist-100">Allowed modes</p>
        <button type="button" onClick={() => onChange(all ? [] : modes)} className="text-xs font-medium text-lavender-300 hover:text-lavender-200">
          {all ? "Clear" : "Select all"}
        </button>
      </div>
      <p className="text-xs text-mist-500">The modes {game.data?.name ?? "this game"} supports. Challenges can only be played in the ones you pick.</p>
      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => {
          const on = values.includes(mode);
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(mode)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm ring-1 ring-inset transition-colors",
                on ? "bg-lavender-400/12 text-mist-50 ring-lavender-400/60" : "text-mist-400 ring-white/10 hover:text-mist-100",
              )}
            >
              {on && <Icon name="check" weight="bold" className="size-3.5 text-lavender-300" />}
              {mode}
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="text-[0.8rem] text-danger">{error}</p>}
    </div>
  );
}

/** Editing a published ladder: the format is fixed, and scoring and the start lock once it runs. */
export type LadderEditing = { started: boolean };

export function CompetitionStep({ form, errors, update, editing }: StepProps & { editing?: LadderEditing }) {
  const f = form.format;
  const r = form.rules;
  const scoringLocked = Boolean(editing?.started);
  return (
    <div className="grid gap-7">
      {!editing && (
      <>
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
      </>
      )}
      <StepSection
        title="Scoring"
        description={scoringLocked ? "Points and draws are locked because the ladder has started and they decide the standings." : undefined}
      >
        <ChipRow legend="Series" options={[1, 3, 5] as const} value={r.bestOf} format={(value) => `Best of ${value}`} onChange={(bestOf) => update("rules", { bestOf })} />
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <TextField id="ladder-win" label="Points for a win" inputMode="numeric" disabled={scoringLocked} value={String(r.winPoints)} onChange={(event) => update("rules", { winPoints: Number(event.target.value.replace(/\D/g, "")) || 0 })} error={errors.winPoints} />
          <TextField id="ladder-draw" label="Points for a draw" inputMode="numeric" disabled={scoringLocked || !r.allowDraws} value={String(r.drawPoints)} onChange={(event) => update("rules", { drawPoints: Number(event.target.value.replace(/\D/g, "")) || 0 })} error={errors.drawPoints} />
        </div>
        <Switch label="Allow draws" description="A series can end level." checked={r.allowDraws} disabled={scoringLocked} onChange={(allowDraws) => update("rules", { allowDraws })} />
        <RematchWaitField hours={r.rematchWaitHours} onChange={(rematchWaitHours) => update("rules", { rematchWaitHours })} error={errors.rematchWait} />
        <ChipRow legend="Matches to place for prizes" options={[0, 3, 5, 10, 15, 20]} value={r.minimumMatchesForPrizes} onChange={(minimumMatchesForPrizes) => update("rules", { minimumMatchesForPrizes })} />
      </StepSection>
      <StepSection title="Rules">
        <ModePicker gameId={form.basics.gameId} values={r.allowedModes} onChange={(allowedModes) => update("rules", { allowedModes })} error={errors.allowedModes} />
        <TagInput label="Allowed maps" hint="Optional" values={r.allowedMaps} onChange={(allowedMaps) => update("rules", { allowedMaps })} placeholder="Ascent, Bind…" />
        <TextAreaField id="ladder-rules" label="House rules (optional)" maxLength={10000} value={r.rulesText ?? ""} onChange={(event) => update("rules", { rulesText: event.target.value })} />
      </StepSection>
    </div>
  );
}

export function AccessStep({ form, errors, update, hubHost, editing }: StepProps & { hubHost: boolean; editing?: LadderEditing }) {
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
        <Switch
          label="Organizers can play"
          description="You and your staff can enter as players. Disputes still go to Gamerie."
          checked={Boolean(j.organizersCanPlay)}
          onChange={(organizersCanPlay) => update("joining", { organizersCanPlay })}
        />
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
        <ScheduleField label={editing?.started ? "Starts (locked once running)" : "Starts"} days={60} disabled={editing?.started} value={toIso(s.startsAt)} onChange={(iso) => update("schedule", { startsAt: iso ? toLocal(iso) : "" })} error={errors.startsAt} />
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
        ["Rematches", form.rules.rematchWaitHours ? `After ${formatRematchWait(form.rules.rematchWaitHours)}` : "Any time"],
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
