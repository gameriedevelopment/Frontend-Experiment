import type { IconName } from "@/components/ui/Icon";
import type { QueueLaneKey } from "@/features/queue/types";

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Press g, then this key. */
  key?: string;
  /** Queue lanes whose waiting count badges this item. */
  lanes?: QueueLaneKey[];
  superAdmin?: boolean;
  /** The build phase that delivers it; unbuilt pages say so instead of pretending. */
  phase?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    label: "Operate",
    items: [
      { to: "/", label: "Overview", icon: "gauge", key: "o" },
      { to: "/queue", label: "Work queue", icon: "queue", key: "q", lanes: ["reports", "tournamentReports", "ladderDisputes", "leagueDisputes"] },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/users", label: "Users", icon: "user", key: "u" },
      { to: "/teams", label: "Teams", icon: "team", key: "t" },
      { to: "/hubs", label: "Hubs", icon: "hub", key: "h" },
    ],
  },
  {
    label: "Competition",
    items: [
      { to: "/tournaments", label: "Tournaments", icon: "trophy" },
      { to: "/ladders", label: "Ladders", icon: "ladders", key: "l" },
      { to: "/leagues", label: "Leagues", icon: "leagues" },
      { to: "/challenges", label: "Challenges", icon: "challenges", key: "c" },
      { to: "/disputes", label: "Disputes", icon: "scales", key: "d", lanes: ["tournamentReports", "ladderDisputes", "leagueDisputes"] },
    ],
  },
  {
    label: "Trust & safety",
    items: [
      { to: "/reports", label: "Reports", icon: "flag", key: "r", lanes: ["reports"] },
      { to: "/flagged", label: "Flagged content", icon: "octagon", key: "f" },
      { to: "/restrictions", label: "Restrictions", icon: "prohibit" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { to: "/games", label: "Games", icon: "games", key: "g" },
      { to: "/achievements", label: "Achievements", icon: "medal" },
    ],
  },
  {
    label: "Growth",
    items: [
      { to: "/analytics", label: "Analytics", icon: "analytics", key: "a" },
      { to: "/referrals", label: "Referrals", icon: "gift" },
      { to: "/communications", label: "Communications", icon: "megaphone" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/administrators", label: "Administrators", icon: "operator", superAdmin: true },
      { to: "/audit", label: "Audit log", icon: "audit" },
      { to: "/settings", label: "Settings", icon: "settings" },
    ],
  },
];

export const NAV_ITEMS = NAV.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));

/** The nav entry a path belongs to, for the breadcrumb and the page title. */
export function navFor(pathname: string) {
  return NAV_ITEMS.filter((item) => (item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`))).sort(
    (a, b) => b.to.length - a.to.length,
  )[0];
}
