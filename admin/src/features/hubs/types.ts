import type { AuditTrailEntry, HostedCompetition, MemberRow, Owner, ReportSummary } from "@/features/people/types";

export interface HubRow {
  id: string;
  name: string;
  slug: string | null;
  type: string;
  visibility: string;
  logo: string | null;
  region: string | null;
  country: string | null;
  organizationName: string | null;
  isBanned: boolean;
  reportCount: number;
  createdAt: string;
  membersCount: number;
  teamsCount: number;
  followersCount: number;
  owner: Owner | null;
}

export interface HubQuery {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "banned";
  reported?: "true";
  type?: string;
  visibility?: string;
  sort?: "newest" | "oldest" | "members" | "reports";
}

export interface HubDossier {
  hub: {
    id: string;
    name: string;
    slug: string | null;
    type: string;
    visibility: string;
    joinPolicy: string;
    logo: string | null;
    backgroundImage: string | null;
    description: string | null;
    country: string | null;
    region: string | null;
    organizationName: string | null;
    games: string[];
    isBanned: boolean;
    reportCount: number;
    createdAt: string;
  };
  owner: Owner | null;
  counts: { members: number; teams: number; followers: number; hosted: number };
  staff: MemberRow[];
  teams: Array<{ id: string; name: string; slug: string | null; logo: string | null; members: number; isBanned: boolean }>;
  hosted: HostedCompetition[];
  reports: { against: number; open: number; latest: ReportSummary[] };
  audit: AuditTrailEntry[];
}
