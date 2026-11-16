import type { IconName } from "@/components/ui/Icon";

export const audiences = [
  {
    label: "Players",
    title: "Make every game part of your story.",
    copy: "Connect your game accounts, find players who fit how you play, and let your record speak before you enter the lobby.",
    image: "/media/audience-player.jpg",
    imageAlt: "A competitive player ready at an esports arena",
  },
  {
    label: "Teams",
    title: "Build beyond the group chat.",
    copy: "Give your roster a home with roles and posts, take on other teams in challenges, and build a history others can follow.",
    image: "/media/audience-team.jpg",
    imageAlt: "A focused competitive player at a team gaming setup",
  },
  {
    label: "Communities",
    title: "Give belonging somewhere to live.",
    copy: "Hubs give communities and organisations a home. Teams join your hub, their players come with them, and your announcements reach everyone.",
    image: "/media/audience-community.jpg",
    imageAlt: "Friends sharing a game together at home",
  },
  {
    label: "Organizers",
    title: "Host competition that counts.",
    copy: "Run tournaments and ladders from your profile, team or hub. Brackets, report windows and standings run on Gamerie, and tournament results land on players' records.",
    image: "/media/audience-organizer.jpg",
    imageAlt: "A competition organizer reviewing performance dashboards",
  },
] as const;

export const industryStats = [
  { value: "$70M", label: "Esports World Cup prize pool" },
  { value: "$2M", label: "The International (Dota 2) prize pool" },
  { value: "550M", label: "Esports viewers worldwide" },
  { value: "$3.1B", label: "Projected esports market" },
];

export const connectableGames = [
  "Valorant",
  "League of Legends",
  "Teamfight Tactics",
  "CS2",
  "Dota 2",
  "PUBG",
  "Clash of Clans",
  "Clash Royale",
  "Brawl Stars",
  "Chess on Lichess",
  "Steam",
  "Battle.net",
];

export const proofSteps = [
  {
    title: "Play the match",
    copy: "Challenges and hosted tournament matches are played between players and teams who are on Gamerie.",
  },
  {
    title: "Report the score",
    copy: "The result is reported on Gamerie. In tournaments, one side declares the score and the other accepts it, or the organiser settles it.",
  },
  {
    title: "It's on the record",
    copy: "The match lands on your record, your GP and level update, and the leaderboards move.",
  },
];

export const resultSources = [
  { label: "Challenges", copy: "Completed between two players or teams on Gamerie.", strength: 3 },
  { label: "Tournaments", copy: "Declared by one side and accepted by the other, or settled by the organiser.", strength: 3 },
  {
    label: "Screenshots",
    copy: "For games played elsewhere. Gamerie reads the result screen and you confirm it, starting with EA FC, Mobile Legends and BGMI.",
    strength: 2,
  },
];

export const gpActions = [
  {
    icon: "identity",
    group: "Profile",
    title: "Complete your profile",
    copy: "Add your details, a profile picture, a cover and your skills.",
  },
  {
    icon: "controller",
    group: "Profile",
    title: "Connect your games",
    copy: "Link the game accounts you already play on.",
  },
  {
    icon: "chat",
    group: "Social",
    title: "Post and connect",
    copy: "Post, comment, gain followers and endorse other players' skills.",
  },
  {
    icon: "team",
    group: "Social",
    title: "Build a team or hub",
    copy: "Create a team or a hub, or join a team that's already playing.",
  },
  {
    icon: "target",
    group: "Competition",
    title: "Take on challenges",
    copy: "Accept, complete and win player and team challenges.",
  },
  {
    icon: "trophy",
    group: "Competition",
    title: "Place in tournaments",
    copy: "Win tournament matches and finish in the top three.",
  },
] as const satisfies ReadonlyArray<{ icon: IconName } & Record<string, string>>;

export const faqs = [
  {
    question: "What is Gamerie?",
    answer:
      "Gamerie is the verified platform for competitive gamers. Build a player identity, connect your game accounts, join teams and hubs, and compete in challenges, tournaments and ladders. Your results go on a record that teams, organisers and other players can trust.",
  },
  {
    question: "Is it free?",
    answer: "Yes. Gamerie's main features are free to use.",
  },
  {
    question: "Which games can I connect?",
    answer:
      "Today you can connect Valorant, League of Legends, Teamfight Tactics, CS2, Dota 2, PUBG, Clash of Clans, Clash Royale, Brawl Stars and chess on Lichess, along with Steam and Battle.net accounts. More games are being added.",
  },
  {
    question: "Is it for solo players or teams?",
    answer:
      "Both. Whether you're a solo player looking for a regular squad or you already run a roster, Gamerie gives you the identity, structure and competition to grow.",
  },
  {
    question: "Can my team or hub host a tournament?",
    answer:
      "Yes. Players, teams and hubs can host tournaments in single elimination, double elimination or round robin formats. Gamerie runs the bracket, the report windows and the results.",
  },
  {
    question: "What are ladders?",
    answer:
      "A ladder is a standings table that runs over a season. Players or teams play each other, earn points for their results and climb the table. Hosts choose who can join: anyone, by approval, hub members only, or privately.",
  },
  {
    question: "How do results get verified?",
    answer:
      "Matches played on Gamerie, in challenges and hosted tournaments, are reported and confirmed on the platform, with the organiser able to settle tournament results. For games played elsewhere, you can upload the result screen: Gamerie reads it and you confirm it.",
  },
  {
    question: "Do I need to be a professional player?",
    answer:
      "No. Gamerie is built for every level, from someone finding their first regular squad to established competitive players and teams.",
  },
];
