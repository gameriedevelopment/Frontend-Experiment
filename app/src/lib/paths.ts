export const playerPath = (usernameOrId: string) => `/profile/${encodeURIComponent(usernameOrId)}`;

export const teamPath = (slugOrId: string) => `/teams/${encodeURIComponent(slugOrId)}`;

/** Where a competition entrant (player or team) links to; null when the entrant has no account behind it. */
export function entrantPath(entrant: {
  kind?: string | null;
  userId?: string | null;
  teamId?: string | null;
}): string | null {
  if (entrant.kind === "team") return entrant.teamId ? teamPath(entrant.teamId) : null;
  if (entrant.userId) return playerPath(entrant.userId);
  return entrant.teamId ? teamPath(entrant.teamId) : null;
}

export const hubPath = (slugOrId: string) => `/hubs/${encodeURIComponent(slugOrId)}`;

/** Where a competition's host links to; Gamerie-run and unknown hosts have no page. */
export function hostPath(host: { type?: string | null; id?: string | null }): string | null {
  if (!host.id) return null;
  if (host.type === "hub") return hubPath(host.id);
  if (host.type === "team") return teamPath(host.id);
  if (host.type === "user") return playerPath(host.id);
  return null;
}
