import type { IconName } from "@/components/ui/Icon";

export interface NavigationItem {
  label: string;
  href: string;
  icon: IconName;
}

export const primaryNavigation: NavigationItem[] = [
  { label: "Home", href: "/home", icon: "home" },
  { label: "Feed", href: "/feed", icon: "feed" },
  { label: "Discover", href: "/users", icon: "discover" },
  { label: "Games", href: "/games", icon: "games" },
  { label: "Teams", href: "/teams", icon: "team" },
  { label: "Hubs", href: "/hubs", icon: "hub" },
];

export const secondaryNavigation: NavigationItem[] = [
  { label: "Messages", href: "/messages", icon: "messages" },
  { label: "Matches", href: "/matches", icon: "matches" },
  { label: "Challenges", href: "/challenges", icon: "challenges" },
  { label: "Tournaments", href: "/tournaments", icon: "trophy" },
  { label: "Ladders", href: "/ladders", icon: "ladders" },
  { label: "Leaderboard", href: "/leaderboard", icon: "leaderboard" },
  { label: "Calendar", href: "/calendar", icon: "calendar" },
];

export const mobileNavigation: NavigationItem[] = [
  { label: "Home", href: "/home", icon: "home" },
  { label: "Feed", href: "/feed", icon: "feed" },
  { label: "Discover", href: "/users", icon: "discover" },
  { label: "Messages", href: "/messages", icon: "messages" },
];

export const mobileMoreNavigation: NavigationItem[] = [
  { label: "Teams", href: "/teams", icon: "team" },
  { label: "Games", href: "/games", icon: "games" },
  { label: "Hubs", href: "/hubs", icon: "hub" },
  ...secondaryNavigation.filter((item) => item.href !== "/messages"),
];

export const pageTitles: Record<string, string> = {
  "/home": "Home",
  "/feed": "Feed",
  "/users": "Discover players",
  "/games": "Games",
  "/teams": "Teams",
  "/hubs": "Hubs",
  "/messages": "Messages",
  "/matches": "Matches",
  "/challenges": "Challenges",
  "/tournaments": "Tournaments",
  "/ladders": "Ladders",
  "/leaderboard": "Leaderboard",
  "/calendar": "Calendar",
  "/search": "Search",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/login": "Sign in",
  "/signin": "Sign in",
  "/register": "Create account",
  "/verify-email": "Verify your email",
  "/verify-phone": "Verify your phone",
  "/forgot-password": "Reset password",
  "/reset-password": "Reset password",
  "/confirm-email": "Confirm email",
  "/confirm-email-change": "Confirm email",
  "/auth": "Signing in",
  "/card": "Player card",
  "/s": "Player card",
};
