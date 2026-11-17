/** Player profile choices shared by sign-up and the first social sign-in. */
export const titles = ["Player", "Streamer", "Spectator", "Coach", "Trainer", "Analyst"] as const;
export const levels = ["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"] as const;
export const platforms = ["PC", "XBOX", "PS5", "Switch", "Mobile"] as const;
export const platformLabels: Record<(typeof platforms)[number], string> = {
  PC: "PC",
  XBOX: "Xbox",
  PS5: "PS5",
  Switch: "Switch",
  Mobile: "Mobile",
};
