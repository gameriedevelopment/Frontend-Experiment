import { createServer } from "node:http";
import { peopleRoute } from "./people.mjs";
import { competitionRoute } from "./competitions.mjs";
import { safetyRoute } from "./safety.mjs";
import { catalogRoute } from "./catalog.mjs";
import { analyticsRoute } from "./analytics.mjs";
import { referralRoute } from "./referrals.mjs";
import { communicationsRoute } from "./communications.mjs";
import { administratorsRoute, adminSessions, mockAdminLogin } from "./administrators.mjs";
import { auditRoute } from "./audit.mjs";

const ago = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString();
const ok = (data) => ({ statusCode: 200, data, message: "ok" });
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
let total = 1800;
const growth = months.map((name, index) => {
  const fresh = 420 + index * 95 + (index % 3) * 60;
  total += fresh;
  return { name, users: total, newUsers: fresh, activeUsers: Math.round(total * 0.42) };
});

const routes = {
  "POST /api/v1/admin-auth/login": (body) => ok(mockAdminLogin(body)),
  "GET /api/v1/admin/session": (_body, user) => ok(user),
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
  "GET /api/v1/admin/hosted-tournaments": () =>
    ok({ data: [{ id: "t1", name: "Mile High Cup", game: "Valorant", official: true, entrantCount: 32, completedAt: null }, { id: "t2", name: "Brooklyn Static Open", game: "EA FC 26", official: false, entrantCount: 16, completedAt: null }], total: 2, page: 1, limit: 6 }),
  "GET /api/v1/admin/ladders": () =>
    ok({ data: [{ id: "d1", name: "Chicago Halo Ladder", game: "Halo Infinite", official: false, participantCount: 48, openDisputes: 1, endsAt: ago(-200) }, { id: "d2", name: "Chess Monthly Challenge", game: "Lichess", official: true, participantCount: 120, openDisputes: 0, endsAt: ago(-500) }], total: 2, page: 1, limit: 6, totalPages: 1 }),
  "GET /api/v1/admin/leagues": () =>
    ok({ data: [{ id: "g1", name: "Austin Ember League", official: false, game: { name: "Rocket League" }, openDisputes: 0, season: { participantCount: 12, endsAt: ago(-900) } }], total: 1, page: 1, limit: 6 }),
};

createServer(async (request, response) => {
  const path = request.url.split("?")[0];
  const user = adminSessions.get(request.headers.authorization);
  const publicRoute = ["/api/v1/admin-auth/login", "/api/v1/admin-invites/lookup", "/api/v1/admin-invites/accept"].includes(path);
  response.setHeader("content-type", "application/json");
  if (!publicRoute && !user) {
    response.statusCode = 401;
    return response.end(JSON.stringify({ statusCode: 401, message: "Unauthorized" }));
  }
  try {
    let body = {};
    if (request.headers["content-type"]?.includes("application/json")) {
      let raw = "";
      for await (const chunk of request) raw += chunk;
      if (raw) body = JSON.parse(raw);
    }
    const args = [request.method, path, request.url, body, user];
    const result = administratorsRoute(...args) ?? auditRoute(...args) ?? communicationsRoute(...args) ?? referralRoute(...args) ?? analyticsRoute(...args) ?? catalogRoute(...args)
      ?? safetyRoute(...args) ?? competitionRoute(...args) ?? peopleRoute(...args);
    const envelope = result !== undefined ? ok(result) : routes[`${request.method} ${path}`]?.(body, user);
    if (!envelope) {
      response.statusCode = 404;
      return response.end(JSON.stringify({ statusCode: 404, message: "Not found" }));
    }
    setTimeout(() => response.end(JSON.stringify(envelope)), 120);
  } catch (error) {
    response.statusCode = error.statusCode ?? (error instanceof SyntaxError ? 400 : 500);
    response.end(JSON.stringify({ statusCode: response.statusCode, message: error.message }));
  }
}).listen(8799, "localhost", () => console.log("admin mock on 8799"));
