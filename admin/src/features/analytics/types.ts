export type AnalyticsRange = "24h" | "7d" | "30d" | "90d";

export interface ContentActivityPoint {
  date: string;
  posts: number;
  likes: number;
  comments: number;
}

export interface PostAnalytics {
  contentActivity: ContentActivityPoint[];
  totalInteractions: number;
  activeUsers: number;
  flaggedContent: number;
  regionalData: { region: string; value: number }[];
  regionAdditions: number;
  topHashtags: { tag: string; count: number }[];
}

export interface RetentionAnalytics {
  window: AnalyticsRange;
  matchesRecorded: number;
  playersRecordingMatches: number;
  levelUps: number;
  streakUpdates: number;
  sharePrompts: number;
  playerCardShares: number;
  shareConversionRate: number;
  notificationsQueued: number;
  notificationsDelivered: number;
  notificationsOpened: number;
  notificationsOptedOut: number;
  notificationsCapped: number;
  notificationOpenRate: number;
}
