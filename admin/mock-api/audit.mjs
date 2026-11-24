import { randomUUID } from "node:crypto";
import { users } from "./people.mjs";

const ago = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString();
const key = (prefix, n) => `${prefix}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const examples = [
  { action: "ladder.dispute_resolved", targetType: "challenge", targetId: key(3, 2), reason: "Screenshot shows 3–1 for Denver Drift.", before: { score: "1–2", outcome: "disputed" }, after: { score: "3–1", outcome: "verified" } },
  { action: "user.ban", targetType: "user", targetId: users[6].id, reason: "Repeated harassment in team chat after two warnings.", before: { isBanned: false }, after: { isBanned: true } },
  { action: "post.delete", targetType: "post", targetId: key(8, 1), reason: "Repeated spam links.", before: { reportCount: 3 }, after: null },
  { action: "tournament.official_created", targetType: "tournament", targetId: key(3, 1), reason: "Opened registration for the next cup.", before: null, after: { name: "Mile High Cup", format: "double_elimination" } },
  { action: "game.update", targetType: "game", targetId: key(1, 2), reason: "Added ranked modes.", before: { gameModes: ["Casual"] }, after: { gameModes: ["Casual", "Ranked"] } },
  { action: "league.season_paused", targetType: "league", targetId: key(5, 1), reason: "Server outage on match night.", before: { status: "in_progress" }, after: { status: "paused" } },
];
const actors = ["jordan", "warlord", "maya"];
const rows = Array.from({ length: 31 }, (_, index) => ({
  id: randomUUID(), actorId: users[index % actors.length].id, actor: actors[index % actors.length],
  requestId: index % 2 ? null : `request-${index + 1}`, ipAddress: null, createdAt: ago(index * 8 + 1),
  ...examples[index % examples.length],
}));

export function auditRoute(method, path, url) {
  if (method !== "GET" || path !== "/api/v1/admin/audit-logs") return;
  const params = new URL(url, "http://localhost").searchParams;
  const page = Number(params.get("page")) || 1;
  const limit = Number(params.get("limit")) || 20;
  const term = params.get("search")?.trim().toLowerCase() ?? "";
  const from = params.get("from");
  const to = params.get("to");
  const data = rows.filter((row) =>
    ["action", "actorId", "targetId", "targetType"].every((field) => !params.get(field) || params.get(field) === row[field])
    && (!term || [row.action, row.reason, row.actor, row.targetId].some((value) => value.toLowerCase().includes(term)))
    && (!from || Date.parse(row.createdAt) >= Date.parse(from))
    && (!to || Date.parse(row.createdAt) <= Date.parse(to)),
  );
  const total = data.length;
  return { data: data.slice((page - 1) * limit, page * limit), total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total };
}
