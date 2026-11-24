const ago = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString();
const names = ["nova", "warlord", "clashgirl54", "marygg", "sarzops", "zoroOG", "denverdrift", "haloace", "brooklynbeat", "emberqueen", "milehigh", "staticray"];
export const users = names.map((name, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  gamerieId: `GMR${String(index + 10).padStart(3, "0")}`,
  username: name,
  email: `${name}@mail.com`,
  profileImage: null,
  role: index === 1 ? "admin" : "user",
  region: ["North America", "Europe", "Africa"][index % 3],
  emailVerified: index % 4 !== 3,
  phoneVerified: index % 3 === 0,
  isBanned: index === 6,
  reportCount: index === 6 ? 4 : index === 2 ? 1 : 0,
  lastLogin: index === 9 ? null : ago(index * 7 + 1),
  createdAt: ago(24 * (index * 9 + 2)),
  profileCompletion: { score: [100, 85, 55, 40, 70, 25, 60, 90, 15, 100, 45, 75][index] },
  progression: { totalGp: [1840, 104, 640, 312, 92, 2210, 50, 780, 20, 1320, 410, 260][index], level: [6, 1, 4, 2, 1, 7, 1, 4, 1, 5, 3, 2][index] },
  referredBy: index % 4 === 1 ? { type: "user", name: "nova" } : index % 5 === 2 ? { type: "partner", name: "DENVER24" } : null,
}));
export const teams = ["Denver Drift", "Chicago Halo", "Brooklyn Static", "Austin Ember", "Mile High Five"].map((name, index) => ({
  id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  name, slug: name.toLowerCase().replace(/ /g, "-"), logo: null, country: "United States", region: ["Colorado", "Illinois", "New York", "Texas", "Colorado"][index],
  level: ["semi_pro", "amateur", "pro", "amateur", "casual"][index], isBanned: index === 3, reportCount: index === 3 ? 2 : 0, createdAt: ago(24 * (index * 13 + 4)),
  membersCount: [8, 5, 6, 3, 4][index], owner: { id: users[index].id, username: users[index].username, profileImage: null },
}));
export const hubs = ["Mile High Gaming", "Rocky Mountain Esports", "Lichess Lounge"].map((name, index) => ({
  id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  name, slug: name.toLowerCase().replace(/ /g, "-"), type: index === 1 ? "organization" : "community", visibility: index === 2 ? "private" : "public",
  logo: null, region: "North America", country: "United States", organizationName: index === 1 ? "RME Holdings LLC" : null, isBanned: false, reportCount: 0,
  createdAt: ago(24 * (index * 20 + 8)), membersCount: [214, 96, 41][index], teamsCount: [6, 3, 0][index], followersCount: [512, 188, 60][index],
  owner: { id: users[index + 3].id, username: users[index + 3].username, profileImage: null },
}));
const page = (rows, url) => {
  const params = new URL(url, "http://x").searchParams;
  const search = (params.get("search") || "").toLowerCase();
  let data = rows.filter((row) => !search || JSON.stringify(row).toLowerCase().includes(search));
  if (params.get("status") === "banned") data = data.filter((row) => row.isBanned);
  if (params.get("reported") === "true") data = data.filter((row) => row.reportCount > 0);
  if (params.get("verified") === "unverified") data = data.filter((row) => !row.emailVerified);
  if (params.get("type")) data = data.filter((row) => row.type === params.get("type"));
  const limit = Number(params.get("limit") || 25);
  return { data: data.slice(0, limit), total: data.length, page: 1, limit, totalPages: 1, hasMore: false };
};
const audit = [
  { id: "x1", actor: "jordan", action: "user.ban", reason: "Repeated harassment in team chat after two warnings", createdAt: ago(30) },
  { id: "x2", actor: "maya", action: "report.resolved", reason: "Warned for spam", createdAt: ago(120) },
];
const reports = [
  { id: "r1", contentType: "user", contentId: "u", type: "harassment", reason: "Kept sending abusive messages after the match", status: "pending", createdAt: ago(5) },
  { id: "r2", contentType: "post", contentId: "p", type: "spam", reason: "Posting the same link everywhere", status: "resolved", createdAt: ago(200) },
];
const recent = [
  { kind: "tournament", id: "t1", name: "Mile High Cup", game: "Valorant", status: "completed", placement: 1, as: "team", enteredAt: ago(400) },
  { kind: "ladder", id: "d1", name: "Chicago Halo Ladder", game: "Halo Infinite", status: "in_progress", placement: null, as: "player", enteredAt: ago(90) },
  { kind: "league", id: "g1", name: "Austin Ember League · Season 2", game: "Rocket League", status: "in_progress", placement: null, as: "team", enteredAt: ago(48) },
];
export function peopleRoute(method, path, url) {
  if (method === "GET" && path === "/api/v1/admin/people/summary")
    return { users: { total: 12483, new7d: 312, active7d: 4120, banned: 37, unverified: 1104, reported: 86 }, teams: { total: 1846, new7d: 41, banned: 6, reported: 19 }, hubs: { total: 212, new7d: 9, banned: 1, reported: 4, organizations: 38 } };
  if (method === "GET" && path === "/api/v1/admin/users") return page(users, url);
  if (method === "GET" && path === "/api/v1/admin/teams") return page(teams, url);
  if (method === "GET" && path === "/api/v1/admin/hubs") return page(hubs, url);
  if (method === "GET" && path === "/api/v1/admin/search") {
    const q = (new URL(url, "http://x").searchParams.get("q") || "").toLowerCase();
    return [
      ...users.filter((u) => u.username.toLowerCase().includes(q)).map((u) => ({ kind: "user", id: u.id, title: u.username, subtitle: `${u.gamerieId} · ${u.email}`, image: null, flagged: u.isBanned || u.reportCount > 0 })),
      ...teams.filter((t) => t.name.toLowerCase().includes(q)).map((t) => ({ kind: "team", id: t.id, title: t.name, subtitle: `${t.membersCount} members · ${t.region}`, image: null, flagged: t.isBanned })),
      ...hubs.filter((h) => h.name.toLowerCase().includes(q)).map((h) => ({ kind: "hub", id: h.id, title: h.name, subtitle: "Community", image: null, flagged: false })),
    ];
  }
  let match = path.match(/^\/api\/v1\/admin\/users\/([^/]+)\/overview$/);
  if (match) {
    const u = users.find((row) => row.id === match[1]) ?? users[0];
    return {
      user: { ...u, fullName: "Nova Reyes", backgroundImage: null, bio: "Valorant IGL. Denver born. Looking for scrims every Thursday.", gamerTitle: "In-game leader", platforms: ["PC", "PS5"], provider: "google", lastSeen: ago(2) },
      progression: u.progression,
      record: { played: 64, won: 41, lost: 19, drawn: 4, tournamentWins: 3 },
      counts: { followers: 1203, following: 188, posts: 74, comments: 402, referrals: 12 },
      referredBy: u.referredBy,
      teams: [{ id: teams[0].id, name: "Denver Drift", slug: null, logo: null, role: "owner", title: "Captain", owner: true, joinedAt: ago(800) }, { id: teams[4].id, name: "Mile High Five", slug: null, logo: null, role: "member", title: "Sub", owner: false, joinedAt: ago(200) }],
      hubs: [{ id: hubs[0].id, name: "Mile High Gaming", slug: null, logo: null, type: "community", role: "member", designation: "honorary_member" }],
      games: [{ provider: "riot", handle: "Nova#NA1", lastSyncedAt: ago(10) }, { provider: "steam", handle: "novareyes", lastSyncedAt: ago(30) }],
      competitions: { entered: { tournaments: 14, ladders: 6, leagues: 2 }, organised: { tournaments: 3, ladders: 1, leagues: 0 }, recent },
      reports: { against: u.reportCount, open: u.reportCount ? 1 : 0, filed: 2, latest: u.reportCount ? reports : [] },
      restrictions: u.isBanned ? [{ source: "creator_lock", kind: "locked", reason: "Ran two fake ladders with prize promises", createdAt: ago(40) }] : [],
      audit: u.isBanned ? audit : [],
    };
  }
  match = path.match(/^\/api\/v1\/admin\/teams\/([^/]+)\/overview$/);
  if (match) {
    const t = teams.find((row) => row.id === match[1]) ?? teams[0];
    return {
      team: { ...t, backgroundImage: null, description: "Denver's semi-pro Valorant roster. Scrims Mon/Thu.", platforms: ["PC"], games: ["Valorant", "CS2"] },
      owner: t.owner, counts: { members: t.membersCount, followers: 340, hubs: 1 },
      members: users.slice(0, 5).map((u, i) => ({ id: u.id, username: u.username, gamerieId: u.gamerieId, profileImage: null, role: i === 0 ? "owner" : "member", title: ["Captain", "Entry", "Support", "Sub", null][i], joinedAt: ago(100 * (i + 1)), isBanned: u.isBanned })),
      hubs: [{ id: hubs[0].id, name: "Mile High Gaming", slug: null, logo: null, type: "community" }],
      competitions: { entered: { tournaments: 9, ladders: 3, leagues: 1 }, recent },
      reports: { against: t.reportCount, open: t.reportCount ? 1 : 0, latest: t.reportCount ? reports : [] }, audit: t.isBanned ? audit : [],
    };
  }
  match = path.match(/^\/api\/v1\/admin\/hubs\/([^/]+)\/overview$/);
  if (match) {
    const h = hubs.find((row) => row.id === match[1]) ?? hubs[0];
    return {
      hub: { ...h, joinPolicy: "open", backgroundImage: null, description: "Colorado's home for competitive gaming nights.", games: ["Valorant", "Rocket League"] },
      owner: h.owner, counts: { members: h.membersCount, teams: h.teamsCount, followers: h.followersCount, hosted: 7 },
      staff: users.slice(3, 6).map((u, i) => ({ id: u.id, username: u.username, gamerieId: u.gamerieId, profileImage: null, role: ["owner", "admin", "manager"][i], title: null, joinedAt: ago(500), isBanned: false })),
      teams: teams.slice(0, 3).map((t) => ({ id: t.id, name: t.name, slug: null, logo: null, members: t.membersCount, isBanned: t.isBanned })),
      hosted: recent.map((r) => ({ kind: r.kind, id: r.id, name: r.name, game: r.game, status: r.status, createdAt: r.enteredAt })),
      reports: { against: 0, open: 0, latest: [] }, audit: [],
    };
  }
  if (method === "PATCH" && /\/ban$/.test(path)) return null;
  return undefined;
}
