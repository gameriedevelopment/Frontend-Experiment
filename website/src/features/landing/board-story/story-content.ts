export type ChapterId = "identity" | "community" | "team" | "compete";

export interface StoryChapter {
  id: ChapterId;
  index: string;
  label: string;
  title: readonly [string, string];
  copy: string;
  unlocks: readonly string[];
  start: number;
  focus: number;
}

export const HERO_END = 0.12;

export const storyChapters: readonly StoryChapter[] = [
  {
    id: "identity",
    index: "01",
    label: "Identity",
    title: ["One player.", "Every game."],
    copy: "Your games, roles, skills, milestones and teams held together as one player identity, so you never start from zero in a new lobby.",
    unlocks: ["Player ID", "Linked games", "Role"],
    start: HERO_END,
    focus: 0.27,
  },
  {
    id: "community",
    index: "02",
    label: "Community",
    title: ["People worth", "playing with."],
    copy: "Discover players through shared games, ambition, level and playstyle. Matches are based on fit, not follower count.",
    unlocks: ["Squad fit"],
    start: 0.34,
    focus: 0.5,
  },
  {
    id: "team",
    index: "03",
    label: "Teams",
    title: ["A real home", "for your roster."],
    copy: "Build teams and hubs with clear membership, roles and posts, and a history others can follow.",
    unlocks: ["Team crest", "Full roster"],
    start: 0.55,
    focus: 0.72,
  },
  {
    id: "compete",
    index: "04",
    label: "Competition",
    title: ["Play becomes", "proof."],
    copy: "Challenges and tournaments feed a verified record: results, rankings and achievements that teams, scouts and sponsors can trust.",
    unlocks: ["Verified result", "Level up"],
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
  { id: "team", at: 0.66, hud: "Joined Lagos Lions" },
  { id: "roster", at: 0.71, hud: "Roster complete · 5/5" },
  { id: "match", at: 0.87, hud: "Won 13–9 vs Northside" },
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
