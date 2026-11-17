import type { IconName } from "@/components/ui/Icon";
import type { PlayerProfile } from "@/features/profile/types";
import type { ProgressionGuide } from "@/features/progression/types";

export type SetupStepId = "game" | "connection" | "avatar" | "follow" | "team" | "challenge";

export interface SetupStep {
  id: SetupStepId;
  icon: IconName;
  title: string;
  description: string;
  action: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  /** GP the backend awards for this step, read from the live rules. Null when no rule applies. */
  gp: number | null;
  progress?: { value: number; target: number };
  complete: boolean;
}

export interface SetupInput {
  profile: PlayerProfile;
  guide?: ProgressionGuide;
  connectionCount: number;
  followingCount: number;
  teamCount: number;
  challengeCount: number;
}

const followTarget = 3;

function ruleAmount(guide: ProgressionGuide | undefined, actionType: string) {
  const rule = guide?.sections.flatMap((section) => section.rules).find((item) => item.actionType === actionType);
  return rule && rule.gpAmount > 0 ? rule.gpAmount : null;
}

const hasItems = (value: unknown) => Array.isArray(value) && value.length > 0;

/** The first moves every new player makes, in the order that makes the rest of Gamerie useful. */
export function buildSetupSteps({ profile, guide, connectionCount, followingCount, teamCount, challengeCount }: SetupInput): SetupStep[] {
  const gamesHref = `/profile/${encodeURIComponent(profile.username)}?tab=games`;
  const following = Math.max(followingCount, profile.following?.length ?? 0);

  return [
    {
      id: "game",
      icon: "games",
      title: "Add your main game",
      description: "Players and teams find you by the games you play.",
      action: { label: "Add a game", href: gamesHref },
      gp: ruleAmount(guide, "game_added"),
      complete: hasItems(profile.gamesPlayed) || hasItems(profile.games),
    },
    {
      id: "connection",
      icon: "link",
      title: "Link a game account",
      description: "Ranks and stats from a linked account show on your Player Card as verified.",
      action: { label: "Link account", href: gamesHref },
      gp: ruleAmount(guide, "game_officially_connected"),
      complete: connectionCount > 0,
    },
    {
      id: "avatar",
      icon: "camera",
      title: "Add a profile photo",
      description: "Teammates and rivals can see who they're playing.",
      action: { label: "Upload photo", href: `/profile/${encodeURIComponent(profile.username)}?edit=photos` },
      gp: ruleAmount(guide, "profile_picture_added"),
      complete: typeof profile.profileImage === "string" && profile.profileImage.trim().length > 0,
    },
    {
      id: "follow",
      icon: "follow",
      title: `Follow ${followTarget} players`,
      description: "Their posts, results and tournament runs fill your feed.",
      action: { label: "Find players", href: "/users" },
      gp: null,
      progress: { value: Math.min(following, followTarget), target: followTarget },
      complete: following >= followTarget,
    },
    {
      id: "team",
      icon: "team",
      title: "Join or start a team",
      description: "Teams take on challenges, enter tournaments and climb ladders together.",
      action: { label: "Browse teams", href: "/teams" },
      secondaryAction: { label: "Start a team", href: "/teams/create" },
      gp: ruleAmount(guide, "team_joined"),
      complete: teamCount > 0,
    },
    {
      id: "challenge",
      icon: "challenges",
      title: "Play your first challenge",
      description: "Challenge any player. Once you both confirm the score, the result goes on your record.",
      action: { label: "Find an opponent", href: "/users" },
      gp: ruleAmount(guide, "challenge_played"),
      complete: challengeCount > 0,
    },
  ];
}
