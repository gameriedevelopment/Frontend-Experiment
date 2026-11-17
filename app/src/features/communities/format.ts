import type { CommunityKind, CommunityMember, HubSummary, TeamSummary } from "./types";

export type Community = TeamSummary | HubSummary;

export const nounOf = (kind: CommunityKind) => (kind === "team" ? "team" : "hub");
export const slugOf = (item: Pick<Community, "slug" | "id">) => item.slug || item.id;
export const hrefOf = (kind: CommunityKind, item: Pick<Community, "slug" | "id">, tab?: string) =>
  `/${kind}s/${encodeURIComponent(slugOf(item))}${tab ? `?tab=${tab}` : ""}`;

/** Counts arrive as numbers on some endpoints and only as embedded lists on others. */
export const countOf = (count: number | undefined, list: unknown[] | undefined) => Number(count ?? list?.length ?? 0);

export const memberUserId = (member: CommunityMember) => member.user?.id || member.userId || "";
export const memberName = (member: CommunityMember) =>
  member.user?.displayName || member.user?.username || "Player";

export function hubTypeLabel(hub: HubSummary) {
  return hub.type === "organization" ? "Organization" : "Community";
}
