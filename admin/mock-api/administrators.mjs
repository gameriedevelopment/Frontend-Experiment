import { randomUUID } from "node:crypto";
import { users } from "./people.mjs";

const base = "/api/v1/admin";
const days = (offset) => new Date(Date.now() + offset * 86_400_000).toISOString();
const byEmail = (email) => email.trim().toLowerCase();
const owner = { id: users[0].id, email: "jordan@gamerie.gg", username: "jordan", role: "admin", adminStatus: "active", isSuperAdmin: true };
const regular = { id: users[1].id, email: "qa-regular@example.test", username: "warlord", role: "admin", adminStatus: "active", isSuperAdmin: false };
export const adminSessions = new Map([["Bearer mock-token", owner], ["Bearer mock-regular-token", regular]]);
export function mockAdminLogin({ email = "" }) {
  const standard = byEmail(email) === regular.email;
  return standard ? { token: "mock-regular-token", user: regular } : { token: "mock-token", user: owner };
}

const members = [
  { id: randomUUID(), userId: owner.id, email: owner.email, username: owner.username, status: "active", isSuperAdmin: true, isProtected: true, createdAt: days(-200), lastActiveAt: days(-0.04) },
  { id: randomUUID(), userId: regular.id, email: regular.email, username: regular.username, status: "active", isSuperAdmin: false, isProtected: false, createdAt: days(-65), invitedByEmail: owner.email, lastActiveAt: days(-1), lastLogin: days(-1) },
  { id: randomUUID(), userId: users[2].id, email: "maya@gamerie.gg", username: "maya", status: "suspended", isSuperAdmin: false, isProtected: false, createdAt: days(-24), invitedByEmail: owner.email, lastActiveAt: days(-11) },
];
const invites = [
  { id: randomUUID(), email: "support@example.test", status: "pending", expiresAt: days(5), invitedByEmail: owner.email, createdAt: days(-2) },
  { id: randomUUID(), email: "review@example.test", status: "revoked", expiresAt: days(-1), invitedByEmail: owner.email, createdAt: days(-8) },
  { id: randomUUID(), email: regular.email, status: "accepted", expiresAt: days(-8), invitedByEmail: owner.email, createdAt: days(-15) },
  { id: randomUUID(), email: "join@example.test", status: "expired", expiresAt: days(-15), invitedByEmail: owner.email, createdAt: days(-22) },
];

const fail = (statusCode, message) => { throw Object.assign(new Error(message), { statusCode }); };
const reason = (body) => {
  if ((body.reason?.trim().length ?? 0) < 5) fail(400, "Give a reason for this action.");
};
function pageOf(records, url) {
  const params = new URL(url, "http://localhost").searchParams;
  const search = params.get("search")?.toLowerCase() ?? "";
  const page = Number(params.get("page")) || 1;
  const limit = Number(params.get("limit")) || 20;
  const matching = records.filter((item) => item.email.toLowerCase().includes(search));
  const total = matching.length;
  return { data: matching.slice((page - 1) * limit, page * limit), total, page, limit, totalPages: Math.ceil(total / limit), hasMore: page * limit < total };
}

export function administratorsRoute(method, path, url, body, user) {
  if (path === "/api/v1/admin-invites/lookup" && method === "GET") {
    if (new URL(url, "http://localhost").searchParams.get("token") !== "mock-invite") fail(404, "This invitation link is not valid.");
    return { email: "join@example.test", requiresPassword: true, requiresProfile: true, invitedByEmail: owner.email };
  }
  if (path === "/api/v1/admin-invites/accept" && method === "POST") {
    if (body.token !== "mock-invite") fail(404, "This invitation link is not valid.");
    return { email: "join@example.test" };
  }
  if (!path.startsWith(`${base}/operators`) && !path.startsWith(`${base}/operator-invites`)) return;
  if (!user?.isSuperAdmin) fail(403, "Super admin access required.");

  if (method === "GET" && path === `${base}/operators`) return pageOf(members, url);
  if (method === "GET" && path === `${base}/operator-invites`) return pageOf(invites, url);
  if (method === "POST" && path === `${base}/operators/invite`) {
    const email = byEmail(body.email ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "Enter a valid email address.");
    if (members.some((member) => member.email === email) || invites.some((invite) => invite.email === email && invite.status === "pending")) fail(409, "That email already has access or a pending invitation.");
    const invite = { id: randomUUID(), email, status: "pending", expiresAt: days(7), invitedByEmail: user.email, createdAt: days(0) };
    invites.unshift(invite);
    return { id: invite.id, email, expiresAt: invite.expiresAt };
  }
  const memberId = /^\/api\/v1\/admin\/operators\/([^/]+)$/.exec(path)?.[1];
  if (memberId && (method === "PATCH" || method === "DELETE")) {
    reason(body);
    const member = members.find((item) => item.id === memberId);
    if (!member) fail(404, "Administrator not found.");
    if (member.isProtected || member.userId === user.id) fail(403, "This administrator is protected.");
    if (method === "DELETE") {
      members.splice(members.indexOf(member), 1);
      return { id: memberId };
    }
    if (!["active", "suspended"].includes(body.status)) fail(400, "Choose an access state.");
    member.status = body.status;
    return member;
  }
  const inviteMatch = /^\/api\/v1\/admin\/operator-invites\/([^/]+)(\/resend)?$/.exec(path);
  if (inviteMatch && (method === "POST" && inviteMatch[2] || method === "DELETE" && !inviteMatch[2])) {
    const invite = invites.find((item) => item.id === inviteMatch[1]);
    if (!invite) fail(404, "Invitation not found.");
    if (invite.status !== "pending") fail(400, "Only pending invitations can be changed.");
    if (method === "DELETE") {
      invite.status = "revoked";
      return { id: invite.id };
    }
    invite.expiresAt = days(7);
    return { id: invite.id, expiresAt: invite.expiresAt };
  }
}
