const ago = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString();
const U = (n) => `00000000-0000-4000-8000-00000000000${n}`;
const G = (n) => `10000000-0000-4000-8000-00000000000${n}`;
const T = (n) => `20000000-0000-4000-8000-00000000000${n}`;
const C = (n) => `30000000-0000-4000-8000-00000000000${n}`;
const cover = (seed) => `https://picsum.photos/seed/${seed}/800/450`;
const games = [
  { id: G(1), name: "Valorant", integrationKey: "valorant", matchVerificationAdapter: null, wallPhoto: cover("valorant"), company: "Riot Games", gameType: "Tactical Shooter", usersCount: 1840, teamsCount: 212 },
  { id: G(2), name: "EA SPORTS FC 26", integrationKey: null, matchVerificationAdapter: "ea-fc", wallPhoto: cover("fc26"), company: "EA Sports", gameType: "Football", usersCount: 1312, teamsCount: 88 },
  { id: G(3), name: "Mobile Legends: Bang Bang", integrationKey: null, matchVerificationAdapter: "mobile-legends", wallPhoto: cover("mlbb"), company: "Moonton", gameType: "MOBA", usersCount: 2204, teamsCount: 301 },
  { id: G(4), name: "Clash Royale", integrationKey: "clash-royale", matchVerificationAdapter: null, wallPhoto: cover("clash"), company: "Supercell", gameType: "Strategy", usersCount: 640, teamsCount: 22 },
  { id: G(5), name: "Lichess", integrationKey: "lichess", matchVerificationAdapter: null, wallPhoto: "https://placehold.co/1200x675/111827/9ca3af?text=Gamerie", company: "Lichess", gameType: "Chess", usersCount: 410, teamsCount: 0 },
  { id: G(6), name: "Rocket League", integrationKey: null, matchVerificationAdapter: null, wallPhoto: cover("rocket"), company: "Psyonix", gameType: "Sports", usersCount: 0, teamsCount: 0 },
  { id: G(7), name: "BGMI", integrationKey: null, matchVerificationAdapter: "bgmi", wallPhoto: cover("bgmi"), company: "Krafton", gameType: "Battle Royale", usersCount: 980, teamsCount: 140 },
].map((game) => ({ description: `${game.name} on Gamerie.`, gameModes: ["Ranked", "Unrated"], requiredSkills: ["Aim", "Comms"], platforms: ["PC", "PlayStation"], officialWebsite: "https://example.com", createdAt: ago(900), updatedAt: ago(20), ...game }));
const achievements = [
  { id: "a1", title: "profile_pioneer", description: "Complete every part of your profile.", category: "social", game: "", points: 50, maxProgress: 100, icon: "", awardedCount: 3120, automatic: true },
  { id: "a2", title: "identity_verified", description: "Verify your email.", category: "social", game: "", points: 25, maxProgress: 100, icon: "", awardedCount: 8790, automatic: true },
  { id: "a3", title: "First Blood", description: "Win your first challenge.", category: "challenges", game: "", points: 100, maxProgress: 1, icon: "", awardedCount: 412, automatic: false },
  { id: "a4", title: "Cup Runner", description: "Reach the final of a Gamerie tournament.", category: "tournaments", game: "Valorant", points: 250, maxProgress: 1, icon: "", awardedCount: 0, automatic: false },
  { id: "a5", title: "Squad Goals", description: "Play ten team challenges with the same team.", category: "team", game: "", points: 150, maxProgress: 10, icon: "", awardedCount: 37, automatic: false },
].map((a) => ({ createdAt: ago(500), ...a }));
const challenges = [
  { id: C(1), type: "user", challengerId: U(1), challengerName: "clashgirl54", challengedId: U(2), challengedName: "denverdrift", game: "Valorant", scheduledDate: ago(-30), format: "Best of 3", status: "accepted", reportCount: 0, result: null },
  { id: C(2), type: "user", challengerId: U(3), challengerName: "zoroOG", challengedId: U(5), challengedName: "sarzops", game: "EA SPORTS FC 26", scheduledDate: ago(48), format: "Best of 1", status: "completed", reportCount: 2, result: { winnerId: U(5), score: "1-3", p1Score: 1, p2Score: 3 } },
  { id: C(3), type: "team", challengerTeamId: T(1), challengerTeamName: "Denver Drift", challengedTeamId: T(2), challengedTeamName: "Brooklyn Static", game: "Valorant", scheduledDate: ago(-72), format: "Best of 3", teamSize: 3, lineupRequired: true, status: "accepted", reportCount: 0, result: null,
    lineups: [{ id: "l1", teamId: T(1), playerId: U(1), side: "challenger", playerNameSnapshot: "clashgirl54" }, { id: "l2", teamId: T(1), playerId: U(2), side: "challenger", playerNameSnapshot: "denverdrift" }, { id: "l3", teamId: T(1), playerId: U(3), side: "challenger", playerNameSnapshot: "zoroOG" }, { id: "l4", teamId: T(2), playerId: U(5), side: "challenged", playerNameSnapshot: "sarzops" }, { id: "l5", teamId: T(2), playerId: U(6), side: "challenged", playerNameSnapshot: "mikasa" }, { id: "l6", teamId: T(2), playerId: U(7), side: "challenged", playerNameSnapshot: "kaiju" }] },
  { id: C(4), type: "user", challengerId: U(6), challengerName: "mikasa", challengedId: U(7), challengedName: "kaiju", game: "Clash Royale", scheduledDate: ago(-5), format: "Best of 5", status: "pending", reportCount: 0, result: null },
  { id: C(5), type: "user", challengerId: U(2), challengerName: "denverdrift", challengedId: U(1), challengedName: "clashgirl54", game: "Lichess", scheduledDate: ago(200), format: "Best of 1", status: "expired", reportCount: 0, result: null },
].map((c) => ({ challengerId: null, challengerName: null, challengedId: null, challengedName: null, challengerTeamId: null, challengerTeamName: null, challengedTeamId: null, challengedTeamName: null, teamSize: null, lineupRequired: false, lineups: [], message: null, createdAt: ago(300), updatedAt: ago(10), ...c }));
const results = [
  { id: "or1", eventName: "Lagos Winter Cup, quarter-final", playedAt: ago(70), recordedAt: ago(60), recordedBy: "jordan", game: { id: G(2), name: "EA SPORTS FC 26" }, player1: { id: U(1), username: "clashgirl54", profileImage: null, score: 3 }, player2: { id: U(2), username: "denverdrift", profileImage: null, score: 1 }, winner: "player1" },
  { id: "or2", eventName: "Campus LAN finals", playedAt: ago(170), recordedAt: ago(150), recordedBy: "maya", game: { id: G(1), name: "Valorant" }, player1: { id: U(3), username: "zoroOG", profileImage: null, score: 13 }, player2: { id: U(5), username: "sarzops", profileImage: null, score: 13 }, winner: "draw" },
];
const page = (rows, params, size = 20) => {
  const p = Number(params.get("page") || 1), limit = Number(params.get("limit") || size);
  return { data: rows.slice((p - 1) * limit, p * limit), total: rows.length, page: p, limit, totalPages: Math.ceil(rows.length / limit) };
};
const has = (value, term) => String(value ?? "").toLowerCase().includes(term);
export function catalogRoute(method, path, url) {
  const params = new URL(url, "http://x").searchParams;
  const q = (params.get("search") || "").toLowerCase();
  if (method === "GET" && path === "/api/v1/admin/games/summary")
    return { counts: { total: games.length, live: 3, verified: 3, unplayed: 1 }, integrationKeys: ["lichess", "clash-royale", "clash-of-clans", "brawl-stars", "league-of-legends", "valorant", "teamfight-tactics", "pubg", "dota-2", "cs2", "steam", "battlenet"], verificationAdapters: ["bgmi", "ea-fc", "mobile-legends"] };
  if (method === "GET" && path === "/api/v1/admin/games") {
    const coverage = params.get("coverage");
    let rows = games.filter((g) => !q || has(g.name, q) || has(g.company, q) || has(g.gameType, q));
    if (coverage === "live") rows = rows.filter((g) => g.integrationKey);
    if (coverage === "verified") rows = rows.filter((g) => g.matchVerificationAdapter);
    if (coverage === "unplayed") rows = rows.filter((g) => !g.usersCount);
    if (params.get("sort") === "popular") rows = [...rows].sort((a, b) => b.usersCount - a.usersCount);
    return page(rows, params);
  }
  const game = path.match(/^\/api\/v1\/admin\/games\/([\w-]+)$/);
  if (game && method === "GET") return games.find((g) => g.id === game[1]) ?? null;
  if (game && method === "PATCH") return games.find((g) => g.id === game[1]);
  if (method === "POST" && path === "/api/v1/admin/games") return games[5];
  if (method === "GET" && path === "/api/v1/admin/achievements") {
    const category = params.get("category");
    return page(achievements.filter((a) => (!category || a.category === category) && (!q || has(a.title, q) || has(a.description, q))), params);
  }
  if ((method === "POST" && path === "/api/v1/admin/achievements") || (method === "PATCH" && path.startsWith("/api/v1/admin/achievements/"))) return achievements[3];
  if (method === "GET" && path === "/api/v1/admin/challenges/summary")
    return { total: 5, pending: 1, reschedule_pending: 0, accepted: 2, completed: 1, rejected: 0, cancelled: 0, expired: 1, reported: 1, organiserResults: results.length };
  if (method === "GET" && path === "/api/v1/admin/challenges") {
    const status = params.get("status"), type = params.get("type");
    return page(challenges.filter((c) => (!status || c.status === status) && (!type || c.type === type) && (params.get("reported") !== "true" || c.reportCount > 0) && (!q || [c.challengerName, c.challengedName, c.challengerTeamName, c.challengedTeamName, c.game].some((v) => has(v, q)))), params);
  }
  const lineup = path.match(/^\/api\/v1\/admin\/challenges\/teams\/([\w-]+)\/eligible-lineup$/);
  if (lineup) {
    const names = lineup[1] === T(1) ? ["clashgirl54", "denverdrift", "zoroOG", "ghostpine"] : ["sarzops", "mikasa", "kaiju", "lumen"];
    return names.map((username, i) => ({ playerId: lineup[1] === T(1) ? [U(1), U(2), U(3), U(4)][i] : [U(5), U(6), U(7), U(8)][i], username, gamerieId: `GM-00${i}`, profileImage: null, role: i === 0 ? "captain" : "member" }));
  }
  const challenge = path.match(/^\/api\/v1\/admin\/challenges\/([\w-]+)$/);
  if (challenge && method === "GET") return challenges.find((c) => c.id === challenge[1]) ?? null;
  if (challenge && method === "PATCH") return challenges.find((c) => c.id === challenge[1]);
  if (method === "POST" && path === "/api/v1/admin/challenges") return challenges[0];
  if (method === "GET" && path === "/api/v1/admin/organiser-results") return page(results.filter((r) => !q || has(r.eventName, q) || has(r.player1.username, q)), params);
  if (method === "POST" && path === "/api/v1/admin/organiser-results") return { id: "or3" };
  return undefined;
}
