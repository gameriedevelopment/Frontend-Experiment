import { Dialog } from "@/components/ui/Dialog";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { ProgressionGuide, ProgressionGuideRule } from "@/features/progression/types";

const sectionIcons: Record<string, IconName> = {
  profile: "identity",
  community: "community",
  teams: "team",
  matches: "matches",
  challenges: "challenges",
  teamChallenges: "team",
  tournaments: "trophy",
};

function limitNote(rule: ProgressionGuideRule) {
  if (rule.dailyGpCap) return `Up to ${rule.dailyGpCap} GP a day`;
  if (rule.lifetimeCountCap === 1) return "Once";
  if (rule.lifetimeCountCap) return `Up to ${rule.lifetimeCountCap} times`;
  return "Every time";
}

export function GpGuideDialog({
  guide,
  open,
  onClose,
}: {
  guide: ProgressionGuide;
  open: boolean;
  onClose: () => void;
}) {
  const { progression } = guide;
  const percent = Math.min(100, Math.max(0, Math.round(progression.progressPercent)));

  return (
    <Dialog
      open={open}
      title="Ways to earn GP"
      description="GP is earned by playing and taking part, and it moves you up levels."
      onClose={onClose}
      size="lg"
      icon="bolt"
    >
      <div className="grid gap-6">
        <section
          aria-label="Your progress"
          className="relative overflow-hidden rounded-2xl bg-lavender-400 px-5 py-4 text-ink-950"
        >
          <div className="halftone absolute inset-0 text-ink-950/15 mask-[linear-gradient(to_left,black,transparent_70%)]" />
          <div className="relative flex items-end justify-between gap-4">
            <p>
              <span className="type-label block text-ink-950/60">Level {progression.level}</span>
              <span className="type-display mt-1 block text-2xl leading-none tabular-nums">
                {progression.totalGp.toLocaleString()} GP
              </span>
            </p>
            <p className="text-right text-sm font-medium text-ink-950/70">
              {progression.nextLevel != null && progression.nextLevelGp != null
                ? `${Math.max(0, progression.nextLevelGp - progression.totalGp).toLocaleString()} to level ${progression.nextLevel}`
                : "Top level reached"}
            </p>
          </div>
          <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-ink-950/15">
            <div className="h-full rounded-full bg-ink-950" style={{ width: `${percent}%` }} />
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          {guide.sections.map((section) => (
            <section key={section.id} className="rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/6">
              <h3 className="flex items-center gap-2.5 text-sm font-semibold">
                <span className="grid size-7 place-items-center rounded-lg bg-lavender-400/12 text-lavender-300">
                  <Icon name={sectionIcons[section.id] ?? "spark"} weight="duotone" className="size-4" />
                </span>
                {section.title}
              </h3>
              <ul className="mt-3.5 grid gap-3">
                {section.rules.map((rule) => (
                  <li key={rule.actionType} className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-sm">{rule.label}</span>
                      <span className="mt-0.5 block text-xs text-mist-500">{limitNote(rule)}</span>
                    </span>
                    <span className="type-label shrink-0 rounded-full bg-lavender-400/12 px-2 py-1 text-lavender-300">
                      +{rule.gpAmount}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {guide.notes.length > 0 && (
          <ul className="grid gap-1.5 text-xs leading-relaxed text-mist-500">
            {guide.notes.map((note) => (
              <li key={note} className="flex gap-2">
                <Icon name="info" className="mt-0.5 size-3.5 shrink-0" />
                {note}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
