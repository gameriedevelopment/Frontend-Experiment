import { useState } from "react";
import { inputClasses } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { Switch } from "@/components/ui/Switch";
import { TimeZoneField } from "@/components/ui/TimeZoneField";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { sameSettings } from "../defaults";
import { useUpdatePlayerSettings } from "../hooks";
import type { NotificationPreferences } from "../types";
import { SaveBar, SettingsCard, SettingsRows } from "./SettingsParts";

const categories: Array<{ key: keyof NotificationPreferences["categories"]; label: string; description: string }> = [
  { key: "competitive", label: "Matches", description: "Challenges, results, tournaments and ladders." },
  { key: "teams", label: "Teams and hubs", description: "Activity and announcements from your teams and hubs." },
  { key: "social", label: "Social", description: "Follows, likes, comments and endorsements." },
  { key: "wallet", label: "Wallet and rewards", description: "Balance changes and rewards." },
  { key: "updates", label: "Gamerie updates", description: "Achievements, news and suggestions." },
];

const windows = [
  { value: "0", label: "Off" },
  { value: "5", label: "5 min" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hr" },
];

type Value = { preferences: NotificationPreferences; timezone: string };

export function NotificationSettings({ preferences, timezone, userId }: { preferences: NotificationPreferences; timezone: string; userId: string }) {
  const saved: Value = { preferences, timezone };
  const [value, setValue] = useState<Value>(saved);
  const update = useUpdatePlayerSettings(userId);
  const dirty = !sameSettings(value, saved);
  const prefs = value.preferences;
  const patch = (next: Partial<NotificationPreferences>) => setValue((current) => ({ ...current, preferences: { ...current.preferences, ...next } }));

  const save = () =>
    update.mutate(
      { notificationPreferences: value.preferences, timezone: value.timezone },
      {
        onSuccess: () => toast.success("Notification settings saved"),
        onError: (error) => toast.error("Couldn't save notification settings", getApiErrorMessage(error, "Try again in a moment.")),
      },
    );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <SettingsCard title="What reaches you" description="Turned-off groups still land in your notifications; they just won't interrupt you.">
        <SettingsRows>
          {categories.map((item) => (
            <Switch
              key={item.key}
              label={item.label}
              description={item.description}
              checked={prefs.categories[item.key]}
              onChange={(checked) => patch({ categories: { ...prefs.categories, [item.key]: checked } })}
            />
          ))}
        </SettingsRows>
        <Notice className="mt-5">Invitations, join requests, wallet transfers, match reminders and ownership changes always come through.</Notice>
      </SettingsCard>

      <SettingsCard title="Quiet hours">
        <div className="grid gap-5">
          <Switch
            label="Hold alerts during quiet hours"
            description="They wait in your notifications until quiet hours end."
            checked={prefs.quietHours.enabled}
            onChange={(checked) => patch({ quietHours: { ...prefs.quietHours, enabled: checked } })}
          />
          <div className={cn("grid gap-4 sm:grid-cols-2", !prefs.quietHours.enabled && "opacity-50")}>
            {(
              [
                ["start", "From"],
                ["end", "Until"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="grid gap-2">
                <span className="text-sm font-medium text-mist-200">{label}</span>
                <input
                  type="time"
                  required
                  disabled={!prefs.quietHours.enabled}
                  value={prefs.quietHours[key]}
                  onChange={(event) => event.target.value && patch({ quietHours: { ...prefs.quietHours, [key]: event.target.value } })}
                  className={cn(inputClasses, "scheme-dark disabled:cursor-not-allowed")}
                />
              </label>
            ))}
          </div>
          <TimeZoneField id="settings-timezone" value={value.timezone} onChange={(zone) => zone && setValue((current) => ({ ...current, timezone: zone }))} hint="Quiet hours follow this time zone." />
        </div>
      </SettingsCard>

      <SettingsCard title="Pace">
        <SettingsRows>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="text-sm font-medium text-mist-100">Bundle alerts</p>
              <p className="mt-0.5 text-xs leading-relaxed text-mist-400">Send activity that arrives close together as one alert.</p>
            </div>
            <Segmented
              label="Bundle window"
              options={windows}
              value={prefs.batching.enabled ? String(prefs.batching.windowMinutes) : "0"}
              onChange={(next) => {
                const minutes = Number(next);
                patch({ batching: { enabled: minutes > 0, windowMinutes: minutes || prefs.batching.windowMinutes } });
              }}
              className="shrink-0 self-start"
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-6">
              <label htmlFor="settings-daily-cap" className="min-w-0">
                <span className="block text-sm font-medium text-mist-100">Daily limit</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-mist-400">After this many alerts in a day, the rest wait quietly.</span>
              </label>
              <output htmlFor="settings-daily-cap" className="shrink-0 text-lg font-semibold tabular-nums">
                {prefs.dailyDeliveryCap}
              </output>
            </div>
            <input
              id="settings-daily-cap"
              type="range"
              min={5}
              max={100}
              step={5}
              value={prefs.dailyDeliveryCap}
              onChange={(event) => patch({ dailyDeliveryCap: Number(event.target.value) })}
              className="mt-4 w-full cursor-pointer accent-lavender-400"
            />
            <div aria-hidden="true" className="mt-1 flex justify-between text-xs tabular-nums text-mist-500">
              <span>5</span>
              <span>100</span>
            </div>
          </div>
        </SettingsRows>
      </SettingsCard>

      <SaveBar dirty={dirty} saving={update.isPending} onDiscard={() => setValue(saved)} onSave={save} />
    </div>
  );
}
