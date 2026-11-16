export type ChapterId = "identity" | "community" | "team" | "compete";

export interface StoryChapter {
  id: ChapterId;
  label: string;
  title: readonly [string, string];
  copy: string;
  start: number;
  focus: number;
}

export const HERO_END = 0.12;

export const storyChapters: readonly StoryChapter[] = [
  {
    id: "identity",
    label: "Identity",
    title: ["One player.", "Every game."],
    copy: "Connect your game accounts and bring your games, roles, skills and teams together in one player identity, so you never start from zero in a new lobby.",
    start: HERO_END,
    focus: 0.27,
  },
  {
    id: "community",
    label: "Community",
    title: ["People worth", "playing with."],
    copy: "Find players by game, level, platform and region. Follow the ones you click with, and keep up through your feed and messages.",
    start: 0.34,
    focus: 0.5,
  },
  {
    id: "team",
    label: "Teams",
    title: ["A real home", "for your roster."],
    copy: "Build a team with roles and posts, then bring it into a hub. Teams join hubs, and their players come with them.",
    start: 0.55,
    focus: 0.72,
  },
  {
    id: "compete",
    label: "Competition",
    title: ["Play becomes", "proof."],
    copy: "Compete in challenges, and in tournaments and ladders hosted by players, teams, hubs or Gamerie. Challenge and tournament results go on your verified record and move the leaderboards.",
    start: 0.76,
    focus: 0.97,
  },
];

export const cardMilestones = [
  { id: "id", at: 0.16, hud: "Player ID created" },
  { id: "games", at: 0.2, hud: "3 games linked" },
  { id: "role", at: 0.25, hud: "Role set · IGL" },
  { id: "level", at: 0.29, hud: "Level 12 reached" },
  { id: "fit", at: 0.47, hud: "3 strong fits found" },
  { id: "team", at: 0.66, hud: "Joined Denver Drift" },
  { id: "roster", at: 0.71, hud: "Roster complete · 5/5" },
  { id: "match", at: 0.87, hud: "Won 13–9 vs Chicago Halo" },
  { id: "verified", at: 0.92, hud: "Result verified" },
  { id: "record", at: 0.96, hud: "Level up · 13" },
] as const;

export type MilestoneId = (typeof cardMilestones)[number]["id"];

export function chapterAt(progress: number) {
  let current = -1;
  storyChapters.forEach((chapter, index) => {
    if (progress >= chapter.start) current = index;
  });
  return current;
}

export function milestonesAt(progress: number) {
  return cardMilestones.filter((milestone) => progress >= milestone.at).length;
}
