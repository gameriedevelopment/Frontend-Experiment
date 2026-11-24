export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface Report {
  id: string;
  contentId: string;
  contentType: string;
  contentAuthorId: string;
  reporterId: string;
  type: string;
  reason: string;
  status: ReportStatus;
  moderatorNotes?: string | null;
  entity?: { id: string; content?: string; username?: string; name?: string; authorName?: string; reportCount?: number; createdAt?: string } | null;
  createdAt: string;
}

export interface ReportsPage {
  data: Report[];
  total: number;
  totalPages: number;
}

export interface ReportQuery {
  page: number;
  perPage: number;
  status?: ReportStatus;
  type?: string;
  contentType?: string;
  search?: string;
}

export interface ReportHistoryEntry {
  id: string;
  action: "created" | "status_changed" | "deleted";
  actorId?: string | null;
  previousStatus?: string | null;
  nextStatus?: string | null;
  metadata?: { moderatorNotes?: string } | null;
  createdAt: string;
}

export interface ReportContext {
  report: {
    reporter: { id: string; username: string | null; profileImage: string | null };
    author: { id: string; username: string | null; profileImage: string | null };
  };
  post: {
    id: string;
    content: string;
    media: string[];
    authorName: string;
    authorImage: string;
    createdAt: string;
    likeCount: number;
    commentCount: number;
    comments: Array<{ id: string; content: string; authorName: string; createdAt: string }>;
  } | null;
}
