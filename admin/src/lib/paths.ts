export type EntityKind = "user" | "team" | "hub" | "tournament" | "ladder" | "league";

const ROOT: Record<EntityKind, string> = {
  user: "/users",
  team: "/teams",
  hub: "/hubs",
  tournament: "/tournaments",
  ladder: "/ladders",
  league: "/leagues",
};

/** The console address of any record. */
export const entityPath = (kind: EntityKind, id: string) => `${ROOT[kind]}/${id}`;
