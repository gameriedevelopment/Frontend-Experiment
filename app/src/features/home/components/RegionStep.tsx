import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { useAuthStore } from "@/features/auth/authStore";
import { useUpdatePlayerProfile } from "@/features/profile/hooks";
import { MAIN_REGIONS } from "@/features/profile/regions";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";

/** Picks a region inside the setup list, so the step is done without leaving Home. */
export function RegionStep() {
  const userId = useAuthStore((state) => state.user?.id);
  const update = useUpdatePlayerProfile(userId);
  const [region, setRegion] = useState("");

  const save = () =>
    update.mutate(
      { region },
      {
        onSuccess: () => toast.success("Region saved", `Players in ${region} can find you more easily.`),
        onError: (error) => toast.error("Couldn't save your region", getApiErrorMessage(error, "Try again in a moment.")),
      },
    );

  return (
    <div className="grid gap-4">
      <ChoiceGroup legend="Region" hint="You can pick a more specific one from your profile later." columns={4}>
        {MAIN_REGIONS.map((item) => (
          <ChoiceChip key={item} name="setup-region" value={item} label={item} checked={region === item} onChange={() => setRegion(item)} />
        ))}
      </ChoiceGroup>
      <div>
        <Button size="sm" icon="check" disabled={!region || update.isPending} onClick={save}>
          {update.isPending ? "Saving…" : "Save region"}
        </Button>
      </div>
    </div>
  );
}
