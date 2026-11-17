import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { OptionCards } from "@/components/ui/OptionCards";
import { Switch } from "@/components/ui/Switch";
import { cookiePreferencesEnabled, openCookiePreferences } from "@/lib/consent";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { sameSettings } from "../defaults";
import { useUpdatePlayerSettings } from "../hooks";
import type { PrivacySettings as Privacy } from "../types";
import { SaveBar, SettingsCard, SettingsRows } from "./SettingsParts";

type Flag = Exclude<keyof Privacy, "profileVisibility">;

const activity: Array<{ key: Flag; label: string; description: string }> = [
  { key: "showOnlineStatus", label: "Online status", description: "Show when you're active." },
  { key: "showGameActivity", label: "Game activity", description: "Show your games, matches and results on your profile." },
];

const details: Array<{ key: Flag; label: string; description: string }> = [
  { key: "showFullName", label: "Full name", description: "Your name alongside your username." },
  { key: "showAge", label: "Age", description: "Worked out from your birthday, which is never shown." },
  { key: "showGender", label: "Gender", description: "As entered in your personal details." },
  { key: "showLocation", label: "Location", description: "The place in your personal details." },
  { key: "showProfession", label: "Profession", description: "What you do outside the game." },
  { key: "showEmail", label: "Email address", description: "The address you sign in with." },
  { key: "showPhone", label: "Phone number", description: "Your verified number." },
];

export function PrivacySettings({ privacy, userId }: { privacy: Privacy; userId: string }) {
  const [value, setValue] = useState(privacy);
  const update = useUpdatePlayerSettings(userId);
  const dirty = !sameSettings(value, privacy);
  const set = <K extends keyof Privacy>(key: K, next: Privacy[K]) => setValue((current) => ({ ...current, [key]: next }));

  const save = () =>
    update.mutate(
      { privacy: value },
      {
        onSuccess: () => toast.success("Privacy saved"),
        onError: (error) => toast.error("Couldn't save privacy", getApiErrorMessage(error, "Try again in a moment.")),
      },
    );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <SettingsCard title="Who can see your profile" description="Your username, photo and title are always visible, so people can find and message you.">
        <OptionCards
          legend="Profile visibility"
          columns={3}
          value={value.profileVisibility}
          onChange={(next) => set("profileVisibility", next)}
          options={[
            { value: "public", label: "Everyone", description: "Anyone on Gamerie sees your full profile.", icon: "globe" },
            { value: "friends", label: "Your followers", description: "Only players who follow you see it all.", icon: "people" },
            { value: "private", label: "Only you", description: "Everyone else sees the basics only.", icon: "lock" },
          ]}
        />
      </SettingsCard>

      <SettingsCard title="Activity">
        <SettingsRows>
          {activity.map((item) => (
            <Switch key={item.key} label={item.label} description={item.description} checked={value[item.key]} onChange={(checked) => set(item.key, checked)} />
          ))}
        </SettingsRows>
      </SettingsCard>

      <SettingsCard title="Personal details" description="Hidden unless you turn them on. They only show to people who can see your full profile.">
        <SettingsRows>
          {details.map((item) => (
            <Switch key={item.key} label={item.label} description={item.description} checked={value[item.key]} onChange={(checked) => set(item.key, checked)} />
          ))}
        </SettingsRows>
      </SettingsCard>

      {cookiePreferencesEnabled && (
        <SettingsCard
          title="Cookies"
          description="Choose which optional cookies Gamerie can use to understand how the app is used. Essential cookies keep you signed in and can't be turned off."
          action={
            <Button tone="outline" size="sm" onClick={openCookiePreferences}>
              Cookie preferences
            </Button>
          }
        />
      )}

      <SaveBar dirty={dirty} saving={update.isPending} onDiscard={() => setValue(privacy)} onSave={save} />
    </div>
  );
}
