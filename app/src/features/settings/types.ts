export interface PrivacySettings {
  profileVisibility: "public" | "friends" | "private";
  showOnlineStatus: boolean;
  showGameActivity: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showFullName: boolean;
  showAge: boolean;
  showGender: boolean;
  showLocation: boolean;
  showProfession: boolean;
}

export interface PlayerSettings {
  privacy: PrivacySettings;
  timezone?: string;
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  categories: {
    social: boolean;
    teams: boolean;
    competitive: boolean;
    updates: boolean;
    wallet: boolean;
  };
  quietHours: { enabled: boolean; start: string; end: string };
  batching: { enabled: boolean; windowMinutes: number };
  dailyDeliveryCap: number;
}

export type SettingsSection = "profile" | "privacy" | "notifications" | "account";

export type SettingsPatch = {
  privacy?: Partial<PrivacySettings>;
  timezone?: string;
  notificationPreferences?: NotificationPreferences;
};
