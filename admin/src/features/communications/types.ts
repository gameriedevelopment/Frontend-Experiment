export interface Announcement {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AnnouncementPage {
  posts: Announcement[];
  nextCursor: string | null;
}

export interface BrevoRunInput {
  dryRun: boolean;
  reason: string;
  confirmation?: string;
}

export interface BrevoReceipt {
  total: number;
  valid: number;
  duplicatesSkipped: number;
  synced: number;
  failed: number;
  dryRun: boolean;
  auditId: string;
}
