import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/features/auth/authStore";
import { usePlayerProfile, useUpdatePlayerProfile } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";

const regions = ["North America", "South America", "Europe", "Africa", "Middle East", "Asia", "Oceania", "Global"];
const snoozeMs = 7 * 24 * 60 * 60 * 1000;

function readSnooze(key: string) {
  try {
    return Number(window.localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

/** A one-line nudge for players without a region. "Not now" hides it for a week. */
export function RegionPrompt() {
  const user = useAuthStore((state) => state.user);
  const key = `Gamerie_region_prompt:${user?.id}`;
  const [snoozedUntil, setSnoozedUntil] = useState(() => readSnooze(key));
  const [picking, setPicking] = useState(false);
  const [region, setRegion] = useState("");
  const candidate = Boolean(user?.id) && !user?.region?.trim() && snoozedUntil <= Date.now();
  const profile = usePlayerProfile(candidate ? user?.username || user?.id : undefined);
  const update = useUpdatePlayerProfile(user?.id);

  if (!candidate || !profile.data || profile.data.region?.trim()) return null;

  const dismiss = () => {
    const until = Date.now() + snoozeMs;
    setSnoozedUntil(until);
    try {
      window.localStorage.setItem(key, String(until));
    } catch {
      // Hidden for this visit when storage is unavailable.
    }
  };

  const save = () =>
    update.mutate(
      { region },
      {
        onSuccess: () => toast.success("Region saved", `Players in ${region} can find you more easily.`),
        onError: (error) => toast.error("Couldn't save your region", getApiErrorMessage(error, "Try again in a moment.")),
      },
    );

  return (
    <section aria-label="Add your region" className="rounded-card bg-ink-900/60 p-4 ring-1 ring-inset ring-white/6 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lavender-400/12 text-lavender-300">
          <Icon name="globe" className="size-[1.1rem]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Where do you play from?</p>
          <p className="mt-0.5 text-sm text-mist-400">Your region helps players and teams near you find you.</p>
        </div>
        {!picking && (
          <div className="hidden shrink-0 gap-1 sm:flex">
            <Button tone="ghost" size="sm" onClick={dismiss}>
              Not now
            </Button>
            <Button tone="outline" size="sm" onClick={() => setPicking(true)}>
              Add region
            </Button>
          </div>
        )}
      </div>
      {!picking && (
        <div className="mt-3 flex gap-1 pl-12 sm:hidden">
          <Button tone="outline" size="sm" onClick={() => setPicking(true)}>
            Add region
          </Button>
          <Button tone="ghost" size="sm" onClick={dismiss}>
            Not now
          </Button>
        </div>
      )}
      {picking && (
        <div className="mt-4 grid gap-4 sm:pl-12">
          <ChoiceGroup legend="Region" columns={4}>
            {regions.map((item) => (
              <ChoiceChip key={item} name="feed-region" value={item} label={item} checked={region === item} onChange={() => setRegion(item)} />
            ))}
          </ChoiceGroup>
          <div className="flex justify-end gap-1">
            <Button tone="ghost" size="sm" disabled={update.isPending} onClick={() => setPicking(false)}>
              Cancel
            </Button>
            <Button size="sm" icon="check" disabled={!region || update.isPending} onClick={save}>
              {update.isPending ? "Saving…" : "Save region"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
