import { ButtonLink } from "@/components/ui/Button";
import { StatePanel } from "@/components/ui/StatePanel";
import { publicLinks } from "@/config/links";
import type { PlayerProfile, ProfileTab } from "../types";

const copy: Partial<Record<ProfileTab, { title: string; description: string }>> = {
  career: {
    title: "Career is next in the rebuild",
    description: "Teams, tournament history and milestones open in the current Gamerie app for now.",
  },
  posts: {
    title: "Posts are next in the rebuild",
    description: "This player's posts open in the current Gamerie app for now.",
  },
};

export function ProfileHandoffTab({ profile, tab }: { profile: PlayerProfile; tab: ProfileTab }) {
  const content = copy[tab] ?? { title: "Coming soon", description: "This section opens in the current Gamerie app." };
  return (
    <StatePanel
      icon="arrowUpRight"
      title={content.title}
      description={content.description}
      action={
        <ButtonLink
          href={new URL(`/profile/${encodeURIComponent(profile.username)}?tab=${tab}`, publicLinks.liveApp).href}
          tone="outline"
          size="sm"
          icon="arrowUpRight"
        >
          Open in current app
        </ButtonLink>
      }
    />
  );
}
