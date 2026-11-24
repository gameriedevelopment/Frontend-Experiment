const ROOT = {
  user: "/users",
  team: "/teams",
  hub: "/hubs",
  tournament: "/tournaments",
  ladder: "/ladders",
  league: "/leagues",
  challenge: "/challenges",
  game: "/games",
  referral_code: "/referrals",
} as const;

export type EntityKind = keyof typeof ROOT;
export const isEntityKind = (value: string): value is EntityKind => Object.prototype.hasOwnProperty.call(ROOT, value);

/** The console address of any record. */
export const entityPath = (kind: EntityKind, id: string) => `${ROOT[kind]}/${id}`;
