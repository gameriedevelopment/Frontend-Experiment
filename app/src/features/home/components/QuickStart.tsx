import { Link } from "react-router-dom";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const actions: Array<{ icon: IconName; title: string; description: string; to: string }> = [
  {
    icon: "challenges",
    title: "Challenge a player",
    description: "Set the game, format and time.",
    to: "/challenges?compose=user",
  },
  {
    icon: "trophy",
    title: "Enter a tournament",
    description: "Brackets hosted on Gamerie.",
    to: "/tournaments",
  },
  {
    icon: "matches",
    title: "Log a match",
    description: "Add a result to your record.",
    to: "/matches/log",
  },
  {
    icon: "team",
    title: "Find a team",
    description: "Join a roster or start one.",
    to: "/teams",
  },
];

export function QuickStart({ className }: { className?: string }) {
  return (
    <nav aria-label="Start something" className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      {actions.map((action) => (
        <Link
          key={action.title}
          to={action.to}
          className="group relative flex flex-col gap-4 rounded-card bg-ink-900/60 p-4 ring-1 ring-inset ring-white/6 transition-[background-color,box-shadow] duration-300 hover:bg-ink-900 hover:ring-lavender-400/25 sm:p-5"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-lavender-400/10 text-lavender-300 transition-colors duration-300 group-hover:bg-lavender-400 group-hover:text-ink-950">
            <Icon name={action.icon} weight="duotone" className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold sm:text-[0.95rem]">{action.title}</span>
            <span className="mt-1 hidden text-sm text-mist-400 sm:block">{action.description}</span>
          </span>
          <Icon
            name="arrowUpRight"
            className="absolute right-4 top-4 size-4 text-mist-500 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-lavender-300 group-hover:opacity-100 sm:right-5 sm:top-5"
          />
        </Link>
      ))}
    </nav>
  );
}
