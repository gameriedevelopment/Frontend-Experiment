import type { AuditTrailEntry, CompetitionEntry, MemberRow, Owner, ReportSummary } from "@/features/people/types";

export interface TeamRow {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  country: string | null;
  region: string | null;
  level: string | null;
  isBanned: boolean;
  reportCount: number;
  createdAt: string;
  membersCount: number;
  owner: Owner | null;
}

export interface TeamQuery {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "banned";
  reported?: "true";
  sort?: "newest" | "oldest" | "members" | "reports";
}

export interface TeamDossier {
  team: {
    id: string;
    name: string;
    slug: string | null;
    logo: string | null;
    backgroundImage: string | null;
    description: string | null;
    country: string | null;
    region: string | null;
    level: string | null;
    platforms: string[];
    games: string[];
    isBanned: boolean;
    reportCount: number;
    createdAt: string;
  };
  owner: Owner | null;
  counts: { members: number; followers: number; hubs: number };
  members: MemberRow[];
  hubs: Array<{ id: string; name: string; slug: string | null; logo: string | null; type: string }>;
  competitions: { entered: { tournaments: number; ladders: number; leagues: number }; recent: CompetitionEntry[] };
  reports: { against: number; open: number; latest: ReportSummary[] };
  audit: AuditTrailEntry[];
}
