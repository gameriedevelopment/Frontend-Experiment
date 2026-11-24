import { useState } from "react";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { getApiErrorMessage } from "@/lib/errors";
import { figure } from "@/lib/format";
import { CATEGORIES, createAchievement, deleteAchievement, updateAchievement, type Achievement, type AchievementInput } from "./api";

const fromAchievement = (achievement: Achievement | null): AchievementInput => ({
  title: achievement?.title ?? "",
  description: achievement?.description ?? "",
  category: achievement?.category ?? "competitor",
  game: achievement?.game ?? "",
  points: achievement?.points ?? 0,
  maxProgress: achievement?.maxProgress || 100,
});

/** Create or edit one achievement. `achievement` is null for a new one. */
export function AchievementDialog({ achievement, onClose, onSaved }: { achievement: Achievement | null; onClose: () => void; onSaved: (message: string) => void }) {
  const baseline = fromAchievement(achievement);
  const [form, setForm] = useState(baseline);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [deleting, setDeleting] = useState(false);
  const set = <K extends keyof AchievementInput>(key: K, value: AchievementInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  const changes = Object.fromEntries(
    (Object.keys(form) as Array<keyof AchievementInput>).filter((key) => form[key] !== baseline[key]).map((key) => [key, typeof form[key] === "string" ? String(form[key]).trim() : form[key]]),
  ) as Partial<AchievementInput>;
  const valid = form.title.trim().length >= 2 && form.description.trim().length >= 2 && form.maxProgress >= 1;
  const ready = valid && (!achievement || Object.keys(changes).length > 0);
  const removable = achievement && !achievement.automatic && achievement.awardedCount === 0;

  const save = async () => {
    setPending(true);
    setError(null);
    try {
      if (achievement) await updateAchievement(achievement.id, changes);
      else await createAchievement({ ...form, title: form.title.trim(), description: form.description.trim(), game: form.game.trim() });
      onSaved(achievement ? "Achievement saved" : "Achievement added");
      onClose();
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  };

  if (deleting && achievement)
    return (
      <ReasonDialog
        title={`Delete ${achievement.title}?`}
        description="Nobody has unlocked it yet, so it simply disappears from the list players see."
        confirmLabel="Delete"
        icon="trash"
        onClose={() => setDeleting(false)}
        onConfirm={(reason) => deleteAchievement(achievement.id, reason).then(() => (onSaved("Achievement deleted"), onClose()))}
      />
    );

  return (
    <Dialog
      open
      size="lg"
      icon="medal"
      title={achievement ? "Edit achievement" : "New achievement"}
      description={achievement?.automatic ? "Gamerie unlocks this one by itself, so its title stays as it is." : "Players see these on their profile and unlock them as they play."}
      onClose={onClose}
      dismissible={!pending}
      footer={
        <>
          {removable && (
            <Button tone="ghost" size="sm" icon="trash" className="mr-auto text-mist-400 hover:text-danger" disabled={pending} onClick={() => setDeleting(true)}>
              Delete
            </Button>
          )}
          <Button tone="ghost" size="sm" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!ready || pending} onClick={() => void save()}>
            {pending ? "Saving…" : achievement ? "Save" : "Add achievement"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <TextField id="achievement-title" label="Title" value={form.title} maxLength={80} disabled={achievement?.automatic} onChange={(event) => set("title", event.target.value)} />
        <TextAreaField id="achievement-description" label="How to unlock it" rows={2} maxLength={300} value={form.description} onChange={(event) => set("description", event.target.value)} />
        <ChoiceGroup legend="Category" columns={5}>
          {CATEGORIES.map((category) => (
            <ChoiceChip key={category.value} name="achievement-category" label={category.label} checked={form.category === category.value} onChange={() => set("category", category.value)} />
          ))}
        </ChoiceGroup>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField id="achievement-game" label="Game" placeholder="Any game" value={form.game} maxLength={100} onChange={(event) => set("game", event.target.value)} />
          <TextField
            id="achievement-points"
            label="Reward points"
            inputMode="numeric"
            value={String(form.points)}
            onChange={(event) => set("points", Number(event.target.value.replace(/\D/g, "").slice(0, 6)) || 0)}
          />
          <TextField
            id="achievement-target"
            label="Steps to unlock"
            inputMode="numeric"
            value={form.maxProgress ? String(form.maxProgress) : ""}
            onChange={(event) => set("maxProgress", Number(event.target.value.replace(/\D/g, "").slice(0, 6)) || 0)}
          />
        </div>
        {achievement && achievement.awardedCount > 0 && (
          <p className="text-sm text-mist-400">
            {figure(achievement.awardedCount)} {achievement.awardedCount === 1 ? "player is" : "players are"} working on or have unlocked this, so it can't be deleted.
          </p>
        )}
        {error != null && <Notice tone="danger">{getApiErrorMessage(error, "That didn't save. Try again.")}</Notice>}
      </div>
    </Dialog>
  );
}
