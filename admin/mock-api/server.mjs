import { createServer } from "node:http";
import { peopleRoute } from "./people.mjs";
import { competitionRoute } from "./competitions.mjs";
import { safetyRoute } from "./safety.mjs";
import { catalogRoute } from "./catalog.mjs";

const ago = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString();
const ok = (data) => ({ statusCode: 200, data, message: "ok" });
const user = { id: "u-admin", email: "jordan@gamerie.gg", username: "jordan", role: "admin", adminStatus: "active", isSuperAdmin: true };
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
let total = 1800;
const growth = months.map((name, index) => {
  const fresh = 420 + index * 95 + (index % 3) * 60;
  total += fresh;
  return { name, users: total, newUsers: fresh, activeUsers: Math.round(total * 0.42) };
});

const routes = {
  "POST /api/v1/admin-auth/login": () => ok({ token: "mock-token", user }),
  "GET /api/v1/admin/session": () => ok(user),
  "GET /api/v1/admin/queue": () =>
    ok({
      reports: { count: 7, oldestAt: ago(31) },
      tournamentReports: { count: 2, oldestAt: ago(3) },
      ladderDisputes: { count: 1, oldestAt: ago(6) },
      leagueDisputes: { count: 0, oldestAt: null },
      total: 10,
      generatedAt: new Date().toISOString(),
    }),
  "GET /api/v1/admin/dashboard-metrics": () =>
    ok({
      users: { total: 12483, thisMonth: 1312, percentageThisMonth: "11.7" },
      teams: { total: 1846, thisMonth: 164, percentageThisMonth: "9.7" },
      tournaments: { total: 412, thisMonth: 38, percentageThisMonth: "10.2" },
      ladders: { total: 96, thisMonth: 14, percentageThisMonth: "17.1" },
      leagues: { total: 23, thisMonth: 6, percentageThisMonth: "35.2" },
      games: { total: 41, thisMonth: 2, percentageThisMonth: "5.1" },
    }),
  "GET /api/v1/admin/user-growth": () => ok(growth),
  "GET /api/v1/admin/audit-logs": () =>
    ok({
      data: [
        { id: "a1", actorId: "u1", actor: "jordan", action: "ladder.dispute_resolved", targetType: "challenge", targetId: "c1", reason: "Screenshot shows 3-1 for Denver Drift", createdAt: ago(0.3) },
        { id: "a2", actorId: "u2", actor: "maya", action: "user.ban", targetType: "user", targetId: "u9", reason: "Repeated harassment in team chat after two warnings", createdAt: ago(2) },
        { id: "a3", actorId: "u2", actor: "maya", action: "post.delete", targetType: "post", targetId: "p1", reason: "Spam link", createdAt: ago(5) },
        { id: "a4", actorId: "u1", actor: "jordan", action: "tournament.official_created", targetType: "tournament", targetId: "t1", reason: "", createdAt: ago(9) },
        { id: "a5", actorId: "u3", actor: "sam", action: "game.update", targetType: "game", targetId: "g1", reason: "Added ranked modes", createdAt: ago(26) },
        { id: "a6", actorId: "u1", actor: "jordan", action: "league.season_paused", targetType: "league", targetId: "l1", reason: "Server outage on match night", createdAt: ago(49) },
      ],
      total: 6,
      page: 1,
      limit: 8,
    }),
  "GET /api/v1/admin/hosted-tournaments": () =>
    ok({ data: [{ id: "t1", name: "Mile High Cup", game: "Valorant", official: true, entrantCount: 32, completedAt: null }, { id: "t2", name: "Brooklyn Static Open", game: "EA FC 26", official: false, entrantCount: 16, completedAt: null }], total: 2, page: 1, limit: 6 }),
  "GET /api/v1/admin/ladders": () =>
    ok({ data: [{ id: "d1", name: "Chicago Halo Ladder", game: "Halo Infinite", official: false, participantCount: 48, openDisputes: 1, endsAt: ago(-200) }, { id: "d2", name: "Chess Monthly Challenge", game: "Lichess", official: true, participantCount: 120, openDisputes: 0, endsAt: ago(-500) }], total: 2, page: 1, limit: 6, totalPages: 1 }),
  "GET /api/v1/admin/leagues": () =>
    ok({ data: [{ id: "g1", name: "Austin Ember League", official: false, game: { name: "Rocket League" }, openDisputes: 0, season: { participantCount: 12, endsAt: ago(-900) } }], total: 1, page: 1, limit: 6 }),
};

createServer((request, response) => {
  const path = request.url.split("?")[0];
  const catalog = catalogRoute(request.method, path, request.url);
  const safety = catalog !== undefined ? catalog : safetyRoute(request.method, path, request.url);
  const competition = safety !== undefined ? safety : competitionRoute(request.method, path, request.url);
  const people = competition !== undefined ? competition : peopleRoute(request.method, path, request.url);
  const handler = people !== undefined ? () => ok(people) : routes[`${request.method} ${path}`];
  const auth = request.headers.authorization;
  response.setHeader("content-type", "application/json");
  if (!handler) {
    response.statusCode = 404;
    return response.end(JSON.stringify({ statusCode: 404, message: "Not found" }));
  }
  if (!path.includes("admin-auth") && auth !== "Bearer mock-token") {
    response.statusCode = 401;
    return response.end(JSON.stringify({ statusCode: 401, message: "Unauthorized" }));
  }
  setTimeout(() => response.end(JSON.stringify(handler())), 120);
}).listen(8799, () => console.log("admin mock on 8799"));
