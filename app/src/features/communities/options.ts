export const TEAM_LEVELS = ["Hobbyist", "Amateur", "Advanced", "Competitor", "Pro"] as const;

export const COMMUNITY_REGIONS = [
  "Global",
  "Africa",
  "West Africa",
  "North Africa",
  "East Africa",
  "Central Africa",
  "Southern Africa",
  "Asia",
  "Middle East",
  "Europe",
  "Northern Europe",
  "Southern Europe",
  "Eastern Europe",
  "Western Europe",
  "Central Europe",
  "North America",
  "South America",
  "Oceania",
] as const;

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const HIERARCHY_ROLES = new Set(["owner", "admin", "manager", "captain", "co-owner"]);

export function formatMemberRole(role?: string | null, title?: string | null): string {
  const normalizedRole = (role || "").toLowerCase().trim();
  if (normalizedRole && HIERARCHY_ROLES.has(normalizedRole)) return capitalize(normalizedRole);
  if (title && title.trim()) return capitalize(title.trim());
  if (normalizedRole) return capitalize(normalizedRole);
  return "Member";
}

