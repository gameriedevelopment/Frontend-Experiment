import { api, unwrap } from "@/lib/api";
import type { Announcement, AnnouncementPage, BrevoReceipt, BrevoRunInput } from "./types";

export const communicationsKey = ["admin", "communications"] as const;

export const listAnnouncements = (cursor?: string) =>
  unwrap<AnnouncementPage>(api.get("/admin/announcements", { params: { cursor, limit: 12 } }));
export const publishAnnouncement = (content: string, reason: string) =>
  unwrap<Announcement>(api.post("/admin/announcements", { content, reason }));
export const runBrevoResync = (input: BrevoRunInput) =>
  unwrap<BrevoReceipt>(api.post("/admin/brevo/resync", input));
