import { StatePanel } from "@/components/ui/StatePanel";
import type { Community } from "../format";
import type { CommunityKind, HubSummary, TeamSummary } from "../types";
import { HubManage } from "./HubManage";
import { TeamManage } from "./TeamManage";

export function CommunityManage({ kind, item }: { kind: CommunityKind; item: Community }) {
  if (!item.viewerRelationship?.canManage)
    return <StatePanel icon="lock" title="Managers only" description={`Ask the ${kind}'s owner for a role that can manage it.`} />;
  return kind === "team" ? <TeamManage team={item as TeamSummary} /> : <HubManage hub={item as HubSummary} />;
}
