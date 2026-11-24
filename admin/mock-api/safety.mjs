const ago = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString();
const U = (n) => `00000000-0000-4000-8000-00000000000${n}`;
const reports = [
  { id: "rp1", contentId: "post-1", contentType: "post", contentAuthorId: U(7), reporterId: U(3), type: "harassment", reason: "Calling out my teammate with slurs after we beat them.", status: "pending", entity: { id: "post-1", content: "Testing markdown\\\nThis was **edited**\\\n\\\n- Denver Drift are trash\\\n- So is everyone on them\\\n\\\n#valorant\\", authorName: "denverdrift" }, createdAt: ago(31) },
  { id: "rp2", contentId: "c-9", contentType: "comment", contentAuthorId: U(5), reporterId: U(1), type: "spam", reason: "Same link on every post.", status: "pending", entity: { id: "c-9", content: "Free skins at totally-legit-skins.example — claim now!!", authorName: "sarzops" }, createdAt: ago(9) },
  { id: "rp3", contentId: U(6), contentType: "user", contentAuthorId: U(6), reporterId: U(2), type: "inappropriate", reason: "Offensive profile picture.", status: "pending", entity: { id: U(6), username: "zoroOG" }, createdAt: ago(2) },
];
export function safetyRoute(method, path, url) {
  const params = new URL(url, "http://x").searchParams;
  if (path === "/api/v1/admin/reports") {
    const status = params.get("status") || "pending";
    const data = reports.filter((r) => r.status === status && (!params.get("contentType") || r.contentType === params.get("contentType")));
    return { data, total: data.length, totalPages: 1 };
  }
  let m = path.match(/^\/api\/v1\/admin\/reports\/([^/]+)\/(context|audit|status)$/);
  if (m) {
    const r = reports.find((row) => row.id === m[1]) ?? reports[0];
    if (m[2] === "audit") return [{ id: "h1", action: "created", createdAt: r.createdAt }];
    if (m[2] === "status") return { ...r, status: "resolved" };
    return {
      report: { reporter: { id: r.reporterId, username: "clashgirl54", profileImage: null }, author: { id: r.contentAuthorId, username: r.entity.authorName ?? r.entity.username, profileImage: null } },
      post: r.contentType === "post" ? { id: r.contentId, content: r.entity.content, media: [], authorName: r.entity.authorName, authorImage: "", createdAt: ago(40), likeCount: 3, commentCount: 12, comments: [] } : null,
    };
  }
  if (path === "/api/v1/admin/flagged-posts" || path === "/api/v1/admin/flagged-comments") {
    const data = [
      { id: "post-1", authorId: U(7), authorName: "denverdrift", content: "Testing markdown\\\nThis was **edited**\\\n\\\n#valorant\\", reportCount: 4, lastReportedAt: ago(5), createdAt: ago(40), post: { id: "post-1" } },
      { id: "post-2", authorId: U(5), authorName: "sarzops", content: "Free skins at totally-legit-skins.example — claim now!! Limited time only, tag three friends to enter.", reportCount: 2, lastReportedAt: ago(30), createdAt: ago(60), post: { id: "post-2" } },
    ];
    return { data, total: data.length, page: 1, limit: 20 };
  }
  if (path === "/api/v1/admin/ladders/creator-locks")
    return [{ id: "lock1", subject: { type: "user", id: U(7), name: "denverdrift", image: null }, kind: "locked", reason: "Ran two fake ladders with prize promises", createdAt: ago(40), createdBy: "x" }];
  if (path === "/api/v1/admin/hosted-tournaments/restrictions")
    return { data: [{ id: "tr1", userId: U(5), kind: "banned", reason: "Cancelled three paid-prize tournaments after entries closed", createdBy: "x", createdAt: ago(300), user: { id: U(5), username: "sarzops", avatar: null } }], total: 1, page: 1, limit: 100 };
  if (method === "DELETE" || (method === "POST" && /restrictions|creator-locks/.test(path))) return null;
  return undefined;
}
