import type { AuditTrailEntry, CompetitionEntry, ReportSummary } from "@/features/people/types";

export interface UserRow {
  id: string;
  gamerieId: string | null;
  username: string;
  email: string;
  profileImage: string | null;
  role: string;
  region: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  isBanned: boolean;
  reportCount: number;
  lastLogin: string | null;
  createdAt: string;
  profileCompletion: { score: number };
  progression: { totalGp: number; level: number };
  referredBy: { type: "user" | "partner"; name: string } | null;
}

export interface UserQuery {
  page: number;
  limit: number;
  search?: string;
  status?: "active" | "banned";
  verified?: "verified" | "unverified";
  reported?: "true";
  recent?: "joined" | "active";
  sort?: "newest" | "oldest" | "active" | "gp" | "reports";
}

export interface UserDossier {
  user: {
    id: string;
    gamerieId: string | null;
    username: string;
    fullName: string | null;
    email: string;
    profileImage: string | null;
    backgroundImage: string | null;
    bio: string | null;
    gamerTitle: string | null;
    region: string | null;
    platforms: string[];
    role: string;
    provider: string | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    isBanned: boolean;
    reportCount: number;
    lastLogin: string | null;
    lastSeen: string | null;
    createdAt: string;
  };
  progression: { totalGp: number; level: number };
  record: { played: number; won: number; lost: number; drawn: number; tournamentWins: number };
  counts: { followers: number; following: number; posts: number; comments: number; referrals: number };
  referredBy: { type: string; name: string } | null;
  teams: Array<{ id: string; name: string; slug: string | null; logo: string | null; role: string; title: string | null; owner: boolean; joinedAt: string | null }>;
  hubs: Array<{ id: string; name: string; slug: string | null; logo: string | null; type: string; role: string; designation: string | null }>;
  games: Array<{ provider: string; handle: string | null; lastSyncedAt: string | null }>;
  competitions: {
    entered: { tournaments: number; ladders: number; leagues: number };
    organised: { tournaments: number; ladders: number; leagues: number };
    recent: CompetitionEntry[];
  };
  reports: { against: number; open: number; filed: number; latest: ReportSummary[] };
  restrictions: Array<{ source: "creator_lock" | "organizer_restriction"; kind: string; reason: string; createdAt: string }>;
  audit: AuditTrailEntry[];
}
