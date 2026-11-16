import type { IconName } from "@/components/ui/Icon";

export const audiences = [
  {
    label: "Players",
    icon: "identity",
    title: "Make every game part of your story.",
    copy: "Carry your identity between games, meet better teammates, and let your progress speak before you enter the lobby.",
    image: "/media/audience-player.jpg",
    imageAlt: "A competitive player ready at an esports arena",
  },
  {
    label: "Teams",
    icon: "team",
    title: "Build beyond the group chat.",
    copy: "Give your roster a proper identity, recruit verified talent, and create a history sponsors and rivals can trust.",
    image: "/media/audience-team.jpg",
    imageAlt: "A focused competitive player at a team gaming setup",
  },
  {
    label: "Communities",
    icon: "hub",
    title: "Give belonging somewhere to live.",
    copy: "Bring players and teams into a shared hub with a clear culture, useful conversations, and discoverable activity.",
    image: "/media/audience-community.jpg",
    imageAlt: "Friends sharing a game together at home",
  },
  {
    label: "Organizers",
    icon: "trophy",
    title: "Run competition with context.",
    copy: "Connect tournaments, schedules, rankings, participants, and outcomes to the player network around them.",
    image: "/media/audience-organizer.jpg",
    imageAlt: "A competition organizer reviewing performance dashboards",
  },
] as const satisfies ReadonlyArray<{ icon: IconName } & Record<string, string>>;

export const industryStats = [
  { value: "$70M", label: "Esports World Cup prize pool" },
  { value: "$2M", label: "The International (Dota 2) prize pool" },
  { value: "550M", label: "Esports viewers worldwide" },
  { value: "$3.1B", label: "Projected esports market" },
];

export const perks = [
  {
    icon: "crown",
    title: "Founder badge",
    copy: "A permanent badge on your profile showing you were here first.",
    rarity: "Legendary",
  },
  {
    icon: "at",
    title: "Reserved username",
    copy: "Claim your perfect handle before anyone else can.",
    rarity: "Epic",
  },
  {
    icon: "gift",
    title: "Exclusive rewards",
    copy: "Early challenge access and premium features.",
    rarity: "Epic",
  },
  {
    icon: "vote",
    title: "Shape the platform",
    copy: "Vote on features and influence the roadmap.",
    rarity: "Rare",
  },
  {
    icon: "flask",
    title: "Beta access",
    copy: "Be first to try new features and challenges.",
    rarity: "Rare",
  },
  {
    icon: "headset",
    title: "Priority support",
    copy: "A direct line to the team, for life.",
    rarity: "Rare",
  },
] as const satisfies ReadonlyArray<{ icon: IconName; rarity: string } & Record<string, string>>;

export type Rarity = (typeof perks)[number]["rarity"];

export const faqs = [
  {
    question: "What is Gamerie?",
    answer:
      "Gamerie is the verified platform for competitive gamers. You build a player identity, find people and teams, join communities, and compete. Every result you play builds a permanent, verified record that teams, scouts and sponsors can trust.",
  },
  {
    question: "Is it free?",
    answer:
      "Yes. The main features of Gamerie are free to use. Optional premium tools will come later for players who want to take their game further.",
  },
  {
    question: "Is it for solo players or teams?",
    answer:
      "Both. Whether you're a solo player looking for a regular squad or you already run a roster, Gamerie gives you the identity, structure and competition to grow.",
  },
  {
    question: "Do I need to be a professional player?",
    answer:
      "No. Gamerie is built for every level, from someone finding their first regular squad to established competitive players and teams.",
  },
  {
    question: "Can I make money as a gamer?",
    answer:
      "Yes, in two ways. Creators earn from their community, starting with a Support feature for tips, with profile subscriptions and a full Creator Program in development. Competitors get discovered: your verified profile shows your skills to teams and scouts looking for talent.",
  },
  {
    question: "How is Gamerie different?",
    answer:
      "Gamerie is built around verified competitive identity. It is not another social profile. It is your competitive history, verified and portable across the games you play.",
  },
  {
    question: "Is there a mobile app?",
    answer:
      "iOS and Android apps are on the way, so you can manage your profile, talk to your team and track your stats from anywhere.",
  },
];
