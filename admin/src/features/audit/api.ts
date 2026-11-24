import { api, unwrap, type AdminPage } from "@/lib/api";
import type { AuditQuery, AuditRecord } from "./types";

export const auditKey = ["admin", "audit"] as const;
export const listAudit = (query: AuditQuery) =>
  unwrap<AdminPage<AuditRecord>>(api.get("/admin/audit-logs", { params: query }));
