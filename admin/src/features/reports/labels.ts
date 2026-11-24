import { plainText } from "@/lib/richText";
import type { IconName } from "@/components/ui/Icon";

export const CONTENT: Record<string, { label: string; icon: IconName }> = {
  post: { label: "Post", icon: "feed" },
  comment: { label: "Comment", icon: "comment" },
  user: { label: "Player", icon: "user" },
  team: { label: "Team", icon: "team" },
  hub: { label: "Hub", icon: "hub" },
  match: { label: "Match", icon: "challenges" },
};

export const contentMeta = (type: string) => CONTENT[type] ?? { label: type, icon: "flag" as IconName };

/** The line a report shows in a list: what was reported, in a few words. */
export function reportedSummary(report: { contentType: string; entity?: { content?: string; username?: string; name?: string; authorName?: string } | null }) {
  const entity = report.entity;
  if (!entity) return "Content no longer exists";
  if (entity.content) return plainText(entity.content) || "No text";
  return entity.username ?? entity.name ?? entity.authorName ?? "Unnamed";
}
