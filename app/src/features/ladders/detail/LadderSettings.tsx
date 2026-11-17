import { useMemo, useState } from "react";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { REGIONS } from "@/features/tournaments/create/draftForm";
import { StepSection } from "@/features/tournaments/create/steps/StepParts";
import { SaveBar } from "@/features/settings/components/SettingsParts";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { datesAndPrizePayload, ladderDraftFromDetail, validateLadderStep, type LadderDraftForm, type LadderFormErrors } from "../create/draft";
import { AccessStep, CompetitionStep, LadderCoverDrop } from "../create/LadderSteps";
import { useLadderManagement } from "../hooks";
import type { LadderDetail } from "../types";

/**
 * Edits a published ladder. The game, host and format are fixed once it's published; points, draws
 * and the start date also lock when it starts, because they decide the standings.
 */
export function LadderSettings({ ladder }: { ladder: LadderDetail }) {
  const management = useLadderManagement(ladder.id);
  const started = ladder.status === "in_progress";
  const initial = useMemo(() => ladderDraftFromDetail(ladder), [ladder]);
  const [form, setForm] = useState<LadderDraftForm>(initial);
  const [errors, setErrors] = useState<LadderFormErrors>({});
  const [cover, setCover] = useState<File | null>(null);
  const saving = management.update.isPending || management.uploadBanner.isPending;
  const dirty = Boolean(cover) || JSON.stringify(form) !== JSON.stringify(initial);

  if (ladder.status === "completed" || ladder.status === "archived") {
    return (
      <div className="flex items-start gap-3 rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6">
        <Icon name="lock" className="mt-0.5 size-5 shrink-0 text-mist-400" />
        <div>
          <p className="font-semibold">Settings are locked</p>
          <p className="mt-1 text-sm text-mist-400">This ladder has finished, so its details, rules and dates stay as they were played.</p>
        </div>
      </div>
    );
  }

  const update = <K extends keyof LadderDraftForm>(section: K, patch: Partial<LadderDraftForm[K]>) => {
    setForm((current) => ({ ...current, [section]: { ...current[section], ...patch } }));
    setErrors({});
  };

  const save = async () => {
    const problems = { ...validateLadderStep("competition", form), ...validateLadderStep("access", form) };
    if (form.basics.name.trim().length < 3) problems.name = "Use at least 3 characters.";
    if (form.joining.maxParticipants != null && form.joining.maxParticipants < ladder.participantCount) {
      problems.maxParticipants = `${ladder.participantCount} have already entered.`;
    }
    if (Object.keys(problems).length) {
      setErrors(problems);
      toast.error("Check the highlighted fields");
      return;
    }
    const schedule = datesAndPrizePayload(form);
    try {
      if (cover) {
        await management.uploadBanner.mutateAsync(cover);
        setCover(null);
      }
      await management.update.mutateAsync({
        details: {
          name: form.basics.name.trim(),
          region: form.basics.region?.trim() || undefined,
          description: form.basics.description?.trim() || undefined,
        },
        rules: form.rules,
        joining: form.joining,
        // A running ladder keeps its exact start, which the form only holds to the minute.
        datesAndPrize: started && ladder.startsAt ? { ...schedule, startsAt: ladder.startsAt } : schedule,
      });
      toast.success("Ladder updated", "Players see the changes right away.");
    } catch (error) {
      toast.error("Couldn't update the ladder", getApiErrorMessage(error, "Try again in a moment."));
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid gap-7 rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
        <StepSection
          title="Details"
          description={`${ladder.game.name} on ${ladder.platform}, hosted by ${ladder.host.name}. The game, host and format are fixed once a ladder is published.`}
        >
          <TextField id="ladder-edit-name" label="Ladder name" maxLength={100} value={form.basics.name} onChange={(event) => update("basics", { name: event.target.value })} error={errors.name} />
          <ChoiceGroup legend="Region (optional)" columns={4}>
            {REGIONS.map((region) => (
              <ChoiceChip key={region} name="ladder-edit-region" value={region} checked={form.basics.region === region} onChange={() => update("basics", { region })} label={region} />
            ))}
          </ChoiceGroup>
          <TextAreaField id="ladder-edit-description" label="Description" maxLength={2000} value={form.basics.description ?? ""} onChange={(event) => update("basics", { description: event.target.value })} />
          <LadderCoverDrop file={cover} url={ladder.banner} onFile={setCover} />
        </StepSection>
      </div>
      <div className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
        <CompetitionStep form={form} errors={errors} update={update} editing={{ started }} />
      </div>
      <div className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
        <AccessStep form={form} errors={errors} update={update} hubHost={ladder.host.type === "hub"} editing={{ started }} />
      </div>
      <SaveBar
        dirty={dirty}
        saving={saving}
        onDiscard={() => {
          setForm(initial);
          setCover(null);
          setErrors({});
        }}
        onSave={() => void save()}
      />
    </div>
  );
}
