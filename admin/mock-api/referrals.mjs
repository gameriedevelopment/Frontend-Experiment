import { randomUUID } from "node:crypto";
import { users } from "./people.mjs";

const base = "/api/v1/admin/growth";
const days = (offset) => new Date(Date.now() + offset * 86_400_000).toISOString();
const codes = [
  { id: "50000000-0000-4000-8000-000000000001", code: "DENVER24", source: "Denver Drift Open", isActive: true, expiresAt: null, createdAt: days(-6) },
  { id: "50000000-0000-4000-8000-000000000002", code: "HALO-WINTER", source: "Chicago Halo winter season", isActive: true, expiresAt: days(12), createdAt: days(-14) },
  { id: "50000000-0000-4000-8000-000000000003", code: "EMBER25", source: "Austin Ember Invitational", isActive: false, expiresAt: null, createdAt: days(-25) },
  { id: "50000000-0000-4000-8000-000000000004", code: "BROOKLYN-FINALS", source: "Brooklyn Static Finals", isActive: true, expiresAt: days(-4), createdAt: days(-38) },
];
const signups = [users[2], users[7], users[10]].map((user, index) => {
  const eligible = index < 2;
  return {
    id: randomUUID(), codeId: codes[0].id, userId: user.id, username: user.username,
    email: user.email, profileImage: user.profileImage, rewardPoints: 0,
    status: index === 1 ? "rewarded" : eligible ? "qualified" : "pending",
    eligibilityStatus: eligible ? "eligible" : "pending", eligibleAt: eligible ? days(-2) : null,
    paymentStatus: index === 1 ? "paid" : "unpaid", paidAt: index === 1 ? days(-1) : null,
    level: eligible ? user.progression.level : 1, recordedMatchCount: index === 0 ? 3 : index === 1 ? 2 : 0,
    createdAt: days(-5 + index), profileCompletion: { ...user.profileCompletion, complete: user.profileCompletion.score === 100 },
  };
});

const statusOf = (code) => code.expiresAt && Date.parse(code.expiresAt) <= Date.now() ? "expired" : code.isActive ? "active" : "inactive";
const rowsFor = (id) => signups.filter((signup) => signup.codeId === id);
const record = (code) => {
  const rows = rowsFor(code.id);
  const eligible = rows.filter((row) => row.eligibilityStatus === "eligible");
  return {
    ...code, signups: rows.length, eligible: eligible.length,
    eligibleUnpaid: eligible.filter((row) => row.paymentStatus === "unpaid").length,
    paid: rows.filter((row) => row.paymentStatus === "paid").length,
    rewarded: rows.filter((row) => row.status === "rewarded").length,
  };
};
const fail = (statusCode, message) => { throw Object.assign(new Error(message), { statusCode }); };
const reason = (body) => {
  if ((body.reason?.trim().length ?? 0) < 5) fail(400, "Give a reason for this action.");
};
function paginate(rows, query) {
  const page = Number(query.get("page")) || 1;
  const limit = Number(query.get("limit")) || 20;
  const total = rows.length;
  return { data: rows.slice((page - 1) * limit, page * limit), page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total };
}

export function referralRoute(method, path, url, body) {
  if (!path.startsWith(`${base}/referral`)) return;
  const query = new URL(url, "http://localhost").searchParams;
  const search = query.get("search")?.trim().toLowerCase() ?? "";

  if (path === `${base}/referrals/summary` && method === "GET") {
    const summary = { total: codes.length, active: 0, inactive: 0, expired: 0 };
    for (const code of codes) summary[statusOf(code)]++;
    return summary;
  }
  if (path === `${base}/referrals`) {
    if (method === "GET") {
      const status = query.get("status");
      return paginate(codes.filter((code) => (!status || statusOf(code) === status)
        && [code.code, code.source].some((value) => value.toLowerCase().includes(search))).map(record), query);
    }
    if (method === "POST") {
      reason(body);
      const code = body.code?.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,50}$/.test(code ?? "") || (body.source?.trim().length ?? 0) < 2) fail(400, "Enter a code and a source.");
      if (codes.some((item) => item.code === code)) fail(409, "That referral code already exists.");
      if (body.expiresAt && !(Date.parse(body.expiresAt) > Date.now())) fail(400, "Expiry must be in the future.");
      const created = { id: randomUUID(), code, source: body.source.trim(), isActive: true, expiresAt: body.expiresAt ?? null, createdAt: days(0) };
      codes.unshift(created);
      return created;
    }
  }
  const codeMatch = /^\/api\/v1\/admin\/growth\/referrals\/([^/]+)(?:\/(signups|status))?$/.exec(path);
  if (codeMatch) {
    const [, id, section] = codeMatch;
    const code = codes.find((item) => item.id === id);
    if (!code) fail(404, "Referral code not found.");
    if (method === "GET" && !section) return record(code);
    if (method === "GET" && section === "signups") {
      const matches = rowsFor(id).filter((signup) => [signup.username, signup.email].some((value) => value.toLowerCase().includes(search)));
      return paginate(matches.map(({ codeId, ...signup }) => signup), query);
    }
    if (method === "PATCH" && section === "status") {
      reason(body);
      if (!["active", "inactive"].includes(body.status)) fail(400, "Choose an available status.");
      code.isActive = body.status === "active";
      return code;
    }
    if (method === "DELETE" && !section) {
      reason(body);
      if (rowsFor(id).length) fail(409, "Codes with attributed sign-ups cannot be deleted.");
      codes.splice(codes.indexOf(code), 1);
      return { id };
    }
  }
  const signupMatch = /^\/api\/v1\/admin\/growth\/referral-signups\/([^/]+)\/payment$/.exec(path);
  if (signupMatch && method === "PATCH") {
    reason(body);
    const signup = signups.find((row) => row.id === signupMatch[1]);
    if (!signup) fail(404, "Referral sign-up not found.");
    if (typeof body.paid !== "boolean") fail(400, "Choose a payment status.");
    if (body.paid && signup.eligibilityStatus !== "eligible") fail(409, "Only eligible referrals can be marked as paid.");
    signup.paymentStatus = body.paid ? "paid" : "unpaid";
    signup.paidAt = body.paid ? signup.paidAt ?? days(0) : null;
    signup.status = body.paid ? "rewarded" : signup.eligibilityStatus === "eligible" ? "qualified" : "pending";
    return signup;
  }
}
