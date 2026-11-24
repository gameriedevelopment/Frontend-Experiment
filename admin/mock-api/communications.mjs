import { randomUUID } from "node:crypto";

const base = "/api/v1/admin";
const ago = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString();
const history = [
  ["jordan", "**Sunday maintenance**\n\nThe feed may be briefly unavailable on Sunday while we make a few updates.", 21],
  ["maya", "Registration is open for the **Mile High Cup**. Check the event page for the schedule.", 54],
  ["jordan", "The ladder dispute desk is back to its usual response times. Thanks for your patience.", 130],
].map(([authorName, content, hours]) => ({
  auditId: randomUUID(), id: randomUUID(), authorName, content, createdAt: ago(hours),
}));

const fail = (statusCode, message) => { throw Object.assign(new Error(message), { statusCode }); };

export function communicationsRoute(method, path, url, body) {
  if (path === `${base}/announcements` && method === "GET") {
    const query = new URL(url, "http://localhost").searchParams;
    const limit = Math.min(100, Math.max(1, Number(query.get("limit")) || 12));
    const cursor = query.get("cursor");
    const index = cursor ? history.findIndex((post) => post.auditId === cursor) : -1;
    if (cursor && index < 0) return { posts: [], nextCursor: null };
    const page = history.slice(index + 1, index + 1 + limit);
    return {
      posts: page.map(({ auditId, ...post }) => post),
      nextCursor: index + 1 + page.length < history.length ? page.at(-1)?.auditId ?? null : null,
    };
  }
  if (method !== "POST") return;
  if (path !== `${base}/announcements` && path !== `${base}/brevo/resync`) return;
  if ((body.reason?.trim().length ?? 0) < 5) fail(400, "Give a reason for this action.");

  if (path === `${base}/announcements`) {
    const content = body.content?.trim();
    if (!content || content.length > 5000) fail(400, "Enter an announcement with up to 5,000 characters.");
    const post = { id: randomUUID(), authorName: "jordan", content, createdAt: ago(0) };
    history.unshift({ ...post, auditId: randomUUID() });
    return post;
  }
  if (typeof body.dryRun !== "boolean") fail(400, "Choose dry run or live sync.");
  if (!body.dryRun && body.confirmation !== "CONFIRM CRM SYNC") fail(400, "Type CONFIRM CRM SYNC to confirm.");
  return {
    total: 43, valid: 37, duplicatesSkipped: 4, synced: body.dryRun ? 0 : 35,
    failed: body.dryRun ? 0 : 2, dryRun: body.dryRun, auditId: randomUUID(),
  };
}
