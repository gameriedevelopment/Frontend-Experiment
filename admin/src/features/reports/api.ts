import { api, unwrap } from "@/lib/api";
import type { Report, ReportContext, ReportHistoryEntry, ReportQuery, ReportsPage } from "./types";

export const listReports = (query: ReportQuery) =>
  unwrap<ReportsPage>(api.get("/admin/reports", { params: { ...query, scope: "community", order: query.status === "pending" ? "oldest" : "newest" } }));

export const getReportContext = (id: string) => unwrap<ReportContext>(api.get(`/admin/reports/${id}/context`));
export const getReportHistory = (id: string) => unwrap<ReportHistoryEntry[]>(api.get(`/admin/reports/${id}/audit`));

export const setReportStatus = (id: string, status: "resolved" | "dismissed", moderatorNotes: string) =>
  unwrap<Report>(api.patch(`/admin/reports/${id}/status`, { status, moderatorNotes }));

/** Takes a reported post or comment down; the reason goes on the audit log. */
export const removeContent = (kind: "post" | "comment", id: string, reason: string) =>
  api.delete(`/admin/${kind === "post" ? "posts" : "comments"}/${id}`, { data: { reason } });
