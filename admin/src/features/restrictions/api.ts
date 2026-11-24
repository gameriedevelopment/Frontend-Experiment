import { api, unwrap, type AdminPage } from "@/lib/api";

export type RestrictionSource = "account" | "community" | "creator" | "hosting";

/** Any limit on a player, team or hub, shaped for one table. */
export interface Restriction {
  key: string;
  source: RestrictionSource;
  subject: { kind: "user" | "team" | "hub"; id: string; name: string; image: string | null };
  what: string;
  kind: "banned" | "locked";
  reason: string | null;
  since: string | null;
  /** The id the lift endpoint takes. */
  liftId: string;
}

type Banned = { id: string; username?: string; name?: string; profileImage?: string | null; logo?: string | null };
type CreatorLock = { id: string; subject: { type: "user" | "hub"; id: string; name: string; image: string | null }; kind: "locked" | "banned"; reason: string; createdAt: string };
type HostingRestriction = { id: string; userId: string; kind: "locked" | "banned"; reason: string; createdAt: string; user: { id: string; username: string; avatar: string | null } | null };

const banned = (kind: "user" | "team" | "hub", rows: Banned[]): Restriction[] =>
  rows.map((row) => ({
    key: `${kind}-ban-${row.id}`,
    source: kind === "user" ? "account" : "community",
    subject: { kind, id: row.id, name: row.username ?? row.name ?? "Unnamed", image: row.profileImage ?? row.logo ?? null },
    what: kind === "user" ? "Banned from Gamerie" : `${kind === "team" ? "Team" : "Hub"} banned`,
    kind: "banned",
    reason: null,
    since: null,
    liftId: row.id,
  }));

const SOURCE_NAMES = ["banned players", "banned teams", "banned hubs", "ladder and league locks", "tournament hosting limits"];

/** Bans, creator locks and hosting restrictions from their five sources. One failing source doesn't hide the rest. */
export async function listRestrictions(): Promise<{ rows: Restriction[]; failed: string[] }> {
  const results = await Promise.allSettled([
    unwrap<AdminPage<Banned>>(api.get("/admin/users", { params: { status: "banned", limit: 100 } })).then((page) => banned("user", page.data)),
    unwrap<AdminPage<Banned>>(api.get("/admin/teams", { params: { status: "banned", limit: 100 } })).then((page) => banned("team", page.data)),
    unwrap<AdminPage<Banned>>(api.get("/admin/hubs", { params: { status: "banned", limit: 100 } })).then((page) => banned("hub", page.data)),
    unwrap<CreatorLock[]>(api.get("/admin/ladders/creator-locks")).then((locks) =>
      locks.map<Restriction>((lock) => ({
        key: `creator-${lock.id}`,
        source: "creator",
        subject: { kind: lock.subject.type, id: lock.subject.id, name: lock.subject.name, image: lock.subject.image },
        what: "Can't create ladders or leagues",
        kind: lock.kind,
        reason: lock.reason,
        since: lock.createdAt,
        liftId: lock.id,
      })),
    ),
    unwrap<AdminPage<HostingRestriction>>(api.get("/admin/hosted-tournaments/restrictions", { params: { page: 1, limit: 50 } })).then((page) =>
      page.data.map<Restriction>((row) => ({
        key: `hosting-${row.id}`,
        source: "hosting",
        subject: { kind: "user", id: row.userId, name: row.user?.username ?? "Unknown player", image: row.user?.avatar ?? null },
        what: "Can't host tournaments",
        kind: row.kind,
        reason: row.reason,
        since: row.createdAt,
        liftId: row.userId,
      })),
    ),
  ]);
  const rows = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const failed = SOURCE_NAMES.filter((_, index) => results[index].status === "rejected");
  if (failed.length === results.length) throw (results[0] as PromiseRejectedResult).reason;
  return { rows: rows.sort((a, b) => (b.since ?? "").localeCompare(a.since ?? "")), failed };
}

export function liftRestriction(restriction: Restriction, reason: string) {
  if (restriction.source === "creator") return api.delete(`/admin/ladders/creator-locks/${restriction.liftId}`);
  if (restriction.source === "hosting") return api.delete(`/admin/hosted-tournaments/restrictions/${restriction.liftId}`);
  const resource = restriction.subject.kind === "user" ? "users" : restriction.subject.kind === "team" ? "teams" : "hubs";
  return api.patch(`/admin/${resource}/${restriction.liftId}/ban`, { ban: false, reason });
}

export function addRestriction(input: { area: "creator" | "hosting"; subject: { kind: "user" | "hub"; id: string }; kind: "locked" | "banned"; reason: string }) {
  if (input.area === "hosting") return api.post("/admin/hosted-tournaments/restrictions", { userId: input.subject.id, kind: input.kind, reason: input.reason });
  return api.post("/admin/ladders/creator-locks", { subjectType: input.subject.kind, subjectId: input.subject.id, kind: input.kind, reason: input.reason });
}
