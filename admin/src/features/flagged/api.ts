import { api, unwrap, type AdminPage } from "@/lib/api";

export interface FlaggedItem {
  id: string;
  authorId?: string;
  authorName?: string;
  content: string;
  reportCount: number;
  lastReportedAt?: string | null;
  createdAt: string;
  /** Comments only: the post they belong to. */
  post?: { id: string } | null;
  postId?: string | null;
}

export type FlaggedKind = "posts" | "comments";

export const listFlagged = (kind: FlaggedKind, page: number) =>
  unwrap<AdminPage<FlaggedItem>>(api.get(`/admin/flagged-${kind}`, { params: { page, limit: 20 } }));

export const removeFlagged = (kind: FlaggedKind, id: string, reason: string) => api.delete(`/admin/${kind}/${id}`, { data: { reason } });
