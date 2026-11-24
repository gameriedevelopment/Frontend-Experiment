export interface AuditRecord {
  id: string;
  actorId: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  requestId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditQuery {
  page: number;
  limit: number;
  search?: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  action?: string;
  from?: string;
  to?: string;
}

export type AuditFilters = Record<"actorId" | "targetId" | "action" | "from" | "to", string>;
