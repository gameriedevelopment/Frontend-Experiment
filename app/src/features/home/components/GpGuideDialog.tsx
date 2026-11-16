import { Dialog } from "@/components/ui/Dialog";
import type { ProgressionGuide, ProgressionGuideRule } from "@/features/progression/types";

function limitNote(rule: ProgressionGuideRule) {
  if (rule.dailyGpCap) return `Up to ${rule.dailyGpCap} GP a day`;
  if (rule.lifetimeCountCap === 1) return "Once";
  if (rule.lifetimeCountCap) return `Up to ${rule.lifetimeCountCap} times`;
  return null;
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
  return (
    <Dialog open={open} title="Ways to earn GP" onClose={onClose}>
      <div className="grid gap-6 px-3 pb-4 pt-3">
        <p className="text-sm leading-relaxed text-mist-400">
          GP is earned by playing and taking part, and it moves you up levels.
        </p>
        {guide.sections.map((section) => (
          <section key={section.id}>
            <h3 className="type-label text-mist-500">{section.title}</h3>
            <ul className="mt-3 grid gap-3">
              {section.rules.map((rule) => {
                const note = limitNote(rule);
                return (
                  <li key={rule.actionType} className="flex items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{rule.label}</span>
                      {note && <span className="mt-0.5 block text-xs text-mist-500">{note}</span>}
                    </span>
                    <span className="type-label shrink-0 pt-0.5 text-lavender-300">+{rule.gpAmount} GP</span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {guide.notes.length > 0 && (
          <ul className="grid gap-1.5 border-t border-white/6 pt-4 text-xs leading-relaxed text-mist-500">
            {guide.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
