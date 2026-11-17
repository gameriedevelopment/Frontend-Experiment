import type { NotificationPreferences, PlayerSettings, PrivacySettings } from "./types";

export const privacyDefaults: PrivacySettings = {
  profileVisibility: "public",
  showOnlineStatus: true,
  showGameActivity: true,
  showEmail: false,
  showPhone: false,
  showFullName: false,
  showAge: false,
  showGender: false,
  showLocation: false,
  showProfession: false,
};

export const notificationDefaults: NotificationPreferences = {
  categories: { social: true, teams: true, competitive: true, updates: true, wallet: true },
  quietHours: { enabled: false, start: "22:00", end: "08:00" },
  batching: { enabled: true, windowMinutes: 5 },
  dailyDeliveryCap: 30,
};

/** Older accounts have partial settings; fill the gaps with the same defaults the API uses. */
export function withDefaults(settings?: Partial<PlayerSettings>): PlayerSettings {
  const prefs = settings?.notificationPreferences;
  return {
    privacy: { ...privacyDefaults, ...settings?.privacy },
    timezone: settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    notificationPreferences: {
      ...notificationDefaults,
      ...prefs,
      categories: { ...notificationDefaults.categories, ...prefs?.categories },
      quietHours: { ...notificationDefaults.quietHours, ...prefs?.quietHours },
      batching: { ...notificationDefaults.batching, ...prefs?.batching },
    },
  };
}

/** Deep equality for plain settings objects, independent of key order. */
export function sameSettings(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  const a = left as Record<string, unknown>;
  const b = right as Record<string, unknown>;
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].every((key) => sameSettings(a[key], b[key]));
}
