import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import type { TeamSummary } from "@/features/communities/types";
import { HomePanel, PanelError, RowSkeletons } from "./HomePanel";

function memberCount(team: TeamSummary) {
  const count = Number(team.membersCount ?? team.members?.length ?? 0);
  return `${count} ${count === 1 ? "member" : "members"}`;
}

export function YourTeams({
  teams,
  loading,
  failed,
  onRetry,
  className,
}: {
  teams: TeamSummary[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <HomePanel className={className} title="Your teams" link={teams.length ? { label: "Teams", to: "/teams" } : undefined}>
      {loading ? (
        <RowSkeletons rows={2} />
      ) : failed ? (
        <PanelError onRetry={onRetry} />
      ) : teams.length ? (
        <ul className="-mx-3 -my-1 flex flex-col gap-1">
          {teams.slice(0, 4).map((team) => (
            <li key={team.id}>
              <Link
                to={`/teams/${encodeURIComponent(team.slug || team.id)}`}
                className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/3"
              >
                <Avatar src={team.logo} name={team.name} size="md" tone="ink" className="rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold transition-colors group-hover:text-lavender-200">
                    {team.name}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-mist-400">
                    {[memberCount(team), team.games?.[0]?.name].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-4">
          <p className="text-sm leading-relaxed text-mist-400">
            Teams take on challenges and enter tournaments together. Joining one also brings you into its hubs.
          </p>
          <div className="flex flex-wrap gap-2">
            <LinkButton to="/teams" size="sm" tone="outline">
              Browse teams
            </LinkButton>
            <LinkButton to="/teams/create" size="sm" tone="ghost" icon="plus">
              Start one
            </LinkButton>
          </div>
        </div>
      )}
    </HomePanel>
  );
}
