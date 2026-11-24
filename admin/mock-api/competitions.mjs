const ago = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString();
const T = "30000000-0000-4000-8000-00000000000";
const L = "40000000-0000-4000-8000-00000000000";
const G = "50000000-0000-4000-8000-00000000000";
const tournaments = [
  { id: `${T}1`, name: "Mile High Cup", game: "Valorant", phase: "live", official: true, source: "official", entrantCount: 32, bracketSize: 32, format: "double_elimination", prize: { total: 5000, currency: "USD", description: "" } },
  { id: `${T}2`, name: "Brooklyn Static Open", game: "EA FC 26", phase: "registration", official: false, source: "hosted", entrantCount: 11, bracketSize: 16, format: "single_elimination", prize: null },
  { id: `${T}3`, name: "Austin Ember Invitational", game: "Rocket League", phase: "completed", official: false, source: "hosted", entrantCount: 8, bracketSize: 8, format: "round_robin", prize: { total: 300, currency: "USD", description: "" } },
  { id: `${T}4`, name: "Chicago Halo Showdown", game: "Halo Infinite", phase: "paused", official: false, source: "hosted", entrantCount: 16, bracketSize: 16, format: "single_elimination", prize: null, removedAt: null },
].map((t, i) => ({ ...t, platform: "PC", region: "North America", mode: "online", banner: null, host: { type: "hub", id: "h", name: ["Gamerie", "Brooklyn Static", "Austin Ember Hub", "Chicago Halo"][i], logo: null }, entrantType: i % 2 ? "player" : "team", teamSize: 5, visibility: "public", startsAt: ago(-24 * (i + 1)), publishedAt: ago(200), completedAt: null, cancelledAt: null }));
const ladders = [
  { id: `${L}1`, name: "Chicago Halo Ladder", status: "in_progress", official: false, game: "Halo Infinite", participantCount: 48, maxParticipants: 64, openDisputes: 1 },
  { id: `${L}2`, name: "Chess Monthly Challenge", status: "in_progress", official: true, game: "Lichess", participantCount: 120, maxParticipants: null, openDisputes: 0 },
  { id: `${L}3`, name: "Denver Drift Weekly", status: "upcoming", official: false, game: "Valorant", participantCount: 9, maxParticipants: 32, openDisputes: 0 },
].map((l) => ({ ...l, platform: "PC", region: "North America", banner: null, host: { type: "hub", name: "Mile High Gaming" }, entrantType: "player", startsAt: ago(300), endsAt: ago(-400), createdAt: ago(500), organizer: { id: "00000000-0000-4000-8000-000000000001", username: "nova", avatar: null }, removed: null }));
const leagues = [
  { id: `${G}1`, name: "Austin Ember League", official: false, status: "active", game: { id: "g", name: "Rocket League" }, entrantType: "team", openDisputes: 1, season: { id: "s1", number: 2, status: "in_progress", startsAt: ago(400), endsAt: ago(-900), participantCount: 12, maxParticipants: 16 } },
  { id: `${G}2`, name: "Gamerie Valorant League", official: true, status: "active", game: { id: "g", name: "Valorant" }, entrantType: "team", openDisputes: 0, season: { id: "s2", number: 1, status: "registration", startsAt: ago(-100), endsAt: ago(-1500), participantCount: 6, maxParticipants: 12 } },
].map((g) => ({ ...g, platform: "PC", region: "North America", banner: null, logo: null, host: { type: "hub", id: "h", name: "Austin Ember Hub", logo: null }, removed: null }));
const page = (data) => ({ data, total: data.length, page: 1, limit: 25, totalPages: 1 });
const names = ["Denver Drift", "Chicago Halo", "Brooklyn Static", "Austin Ember", "Mile High Five", "Static Ray", "Halo Ace", "Ember Queen"];
const activity = [
  { id: "a1", action: "result.corrected", actorRole: "admin", actor: "jordan", details: { reason: "Screenshot shows 3-1" }, createdAt: ago(3) },
  { id: "a2", action: "participant.joined", actorRole: "participant", actor: "haloace", details: null, createdAt: ago(20) },
  { id: "a3", action: "season.started", actorRole: "owner", actor: null, details: null, createdAt: ago(200) },
];
export function competitionRoute(method, path, url) {
  const params = new URL(url, "http://x").searchParams;
  if (path === "/api/v1/admin/competitions/matches-by-week")
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.now() - (11 - i) * 7 * 86400000);
      const week = d.toISOString().slice(0, 10);
      return { week, friendly: 30 + ((i * 7) % 13), tournament: 12 + ((i * 5) % 9), ladder: 18 + i * 2, league: i > 5 ? 10 + (i % 4) : 0 };
    });
  if (path === "/api/v1/admin/competitions/summary")
    return { tournaments: { total: 412, live: 3, registration: 18, completed: 371, cancelled: 9, official: 22, removed: 4 }, ladders: { total: 96, running: 14, upcoming: 6, completed: 70, official: 8, removed: 2 }, leagues: { total: 23, running: 9, registration: 4, completed: 8, official: 3, removed: 0 } };
  if (path === "/api/v1/admin/hosted-tournaments/reports")
    return page([{ id: "rep1", status: "pending", type: "wrong_score", reason: "We won 2-1, they reported 1-2. VOD attached in Discord.", createdAt: ago(14), tournament: { id: `${T}1`, name: "Mile High Cup", game: "Valorant", official: true }, match: { number: 12, lane: "upper", round: 3 }, challenge: { sideA: "Denver Drift", sideB: "Chicago Halo", declaredScore: "1-2", declaredSide: "b" } }]);
  if (path === "/api/v1/admin/ladders/disputes")
    return page([{ id: "lad1", createdAt: ago(8), reportedAt: ago(6), evidenceUrl: "https://example.com/proof.png", declaredSide: "a", result: { score: "3-1", p1Score: 3, p2Score: 1, notes: "Opponent disconnected and came back, then claimed the win." }, challenger: { name: "haloace" }, challenged: { name: "staticray" }, ladder: { id: `${L}1`, name: "Chicago Halo Ladder", game: "Halo Infinite", official: false } }]);
  if (path === "/api/v1/admin/leagues/disputes")
    return page([{ id: "fix1", stage: "regular", week: 4, sideA: { name: "Austin Ember" }, sideB: { name: "Mile High Five" }, matchAt: ago(30), scoreA: 2, scoreB: 2, evidenceUrl: null, notes: "Third game never finished.", league: { id: `${G}1`, name: "Austin Ember League", official: false, game: "Rocket League" } }]);
  if (path === "/api/v1/admin/hosted-tournaments") return page(tournaments.filter((t) => !params.get("phase") || t.phase === params.get("phase")));
  if (path === "/api/v1/admin/ladders") return page(ladders.filter((l) => !params.get("status") || l.status === params.get("status")));
  if (path === "/api/v1/admin/leagues") return page(leagues);
  let m = path.match(/^\/api\/v1\/admin\/hosted-tournaments\/([^/]+)(\/.*)?$/);
  if (m) {
    const t = tournaments.find((row) => row.id === m[1]) ?? tournaments[0];
    if (m[2] === "/participants") return names.map((name, i) => ({ id: `e${i}`, kind: "team", name, avatar: null, userId: null, teamId: `10000000-0000-4000-8000-00000000000${(i % 5) + 1}`, status: i > 5 ? "eliminated" : "active", seed: i + 1, placement: t.phase === "completed" ? i + 1 : null, registeredAt: ago(300) }));
    if (m[2] === "/manage/activity") return page(activity);
    if (!m[2]) return { ...t, description: "Colorado's biggest Valorant event of the fall. Double elimination, best of three, grand final best of five.", registrationMode: "approval", seedingMethod: "manual", matchRules: { bestOf: { default: 3 }, thirdPlaceMatch: true, noShowMinutes: 10, reportWindowMinutes: 60 }, cancelReason: null };
  }
  m = path.match(/^\/api\/v1\/admin\/ladders\/([^/]+)(\/.*)?$/);
  if (m) {
    const l = ladders.find((row) => row.id === m[1]) ?? ladders[0];
    if (m[2] === "/participants") return { groups: [], participants: names.map((name, i) => ({ id: `p${i}`, name, avatar: null, kind: "player", status: "active", groupId: null, points: 30 - i * 3, played: 10 - i, rematchLocks: i === 2 ? 1 : 0 })) };
    if (m[2] === "/matches") {
      const status = params.get("status");
      const rows = [
        { id: "c1", status: "disputed", scheduledAt: ago(10), finalAt: null, challenger: { participantId: "p0", name: "haloace" }, challenged: { participantId: "p5", name: "staticray" }, result: { winnerParticipantId: "p0", challengerScore: 3, challengedScore: 1 } },
        { id: "c2", status: "completed", scheduledAt: ago(30), finalAt: ago(29), challenger: { participantId: "p1", name: "Chicago Halo" }, challenged: { participantId: "p2", name: "Brooklyn Static" }, result: { winnerParticipantId: "p2", challengerScore: 1, challengedScore: 2 } },
        { id: "c3", status: "accepted", scheduledAt: ago(-5), finalAt: null, challenger: { participantId: "p3", name: "Austin Ember" }, challenged: { participantId: "p4", name: "Mile High Five" }, result: null },
      ];
      const map = { disputed: ["disputed"], open: ["accepted", "pending"], final: ["completed"], cancelled: ["cancelled"] };
      return page(status ? rows.filter((r) => map[status]?.includes(r.status)) : rows);
    }
    if (!m[2]) return { ...l, game: { id: "g", name: l.game }, host: { type: "hub", id: "h", name: "Mile High Gaming", logo: null }, teamSize: null, joinMode: "open", description: "Challenge anyone in your group. Top 3 split the prize.", points: { win: 3, draw: 1, loss: 0 }, allowDraws: true, bestOf: 3, groups: { count: 1 }, prize: { total: 250, currency: "USD" }, organizer: { id: "00000000-0000-4000-8000-000000000001", username: "nova", email: "nova@mail.com", avatar: null }, participantsByStatus: { active: 46, inactive: 2 }, matches: { completed: 212, open: 18, disputed: l.openDisputes }, activity };
  }
  m = path.match(/^\/api\/v1\/admin\/leagues\/([^/]+)(\/.*)?$/);
  if (m) {
    const g = leagues.find((row) => row.id === m[1]) ?? leagues[0];
    if (m[2] && m[2].endsWith("/fixtures")) {
      const status = params.get("status");
      const rows = [
        { id: "f1", stage: "regular", week: 4, status: "disputed", sideA: { participantId: "x1", name: "Austin Ember" }, sideB: { participantId: "x2", name: "Mile High Five" }, matchAt: ago(30), scoreA: 2, scoreB: 2, winner: "draw" },
        { id: "f2", stage: "regular", week: 5, status: "open", sideA: { participantId: "x3", name: "Denver Drift" }, sideB: { participantId: "x4", name: "Chicago Halo" }, matchAt: ago(-20), scoreA: null, scoreB: null, winner: null },
        { id: "f3", stage: "regular", week: 3, status: "final", sideA: { participantId: "x5", name: "Brooklyn Static" }, sideB: { participantId: "x1", name: "Austin Ember" }, matchAt: ago(190), scoreA: 1, scoreB: 3, winner: "b" },
      ];
      return status ? rows.filter((r) => r.status === status) : rows;
    }
    if (!m[2]) {
      const season = { id: g.season.id, number: g.season.number, status: g.season.status, paused: false, startsAt: g.season.startsAt, endsAt: g.season.endsAt, format: "double", matchDay: 4, matchTime: "19:00", timeZone: "America/Denver", bestOf: 3, points: { win: 3, draw: 1, loss: 0 }, allowDraws: true, groups: { count: 1 }, playoffs: { size: 4, format: "single_elimination" }, maxParticipants: 16, participantCount: 12, prize: { total: 1000, currency: "USD" }, weeks: 11, completedAt: null };
      return { ...g, description: "Thursday night Rocket League for Austin teams.", organizer: { id: "00000000-0000-4000-8000-000000000004", username: "marygg", email: "marygg@mail.com", avatar: null }, seasons: [{ ...season, id: "s0", number: 1, status: "completed" }, season], currentSeason: season, participantsByStatus: { active: 12 }, fixturesByStatus: { final: 30, open: 6, scheduled: 30, disputed: 1 }, activity };
    }
  }
  if (method === "POST" && /^\/api\/v1\/admin\/(hosted-tournaments|ladders|leagues)\//.test(path)) return null;
  return undefined;
}
