import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useUserTeams } from "@/features/communities/hooks";
import { isTeamOwner } from "@/features/communities/ownership";
import type { TeamSummary } from "@/features/communities/types";
import type { PlayerProfile } from "../../types";
import { ProfileSection } from "../ProfileSection";
import { MarketValue } from "./MarketValue";
import { Milestones } from "./Milestones";
import { TournamentHistory } from "./TournamentHistory";

function LevelRing({ level, percent }: { level: number; percent: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative grid size-32 shrink-0 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} className="fill-none stroke-white/8" strokeWidth="6" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="fill-none stroke-lavender-400 transition-[stroke-dashoffset] duration-1000 ease-out-expo"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
      </svg>
      <span className="grid justify-items-center">
        <span className="type-label text-mist-500">Level</span>
        <span className="type-display text-4xl leading-none tabular-nums">{level}</span>
      </span>
    </div>
  );
}

function Progression({ profile }: { profile: PlayerProfile }) {
  const progression = profile.progression;
  const totalGp = Math.max(0, Number(progression?.totalGp) || 0);
  const level = Math.max(0, Number(progression?.level) || 0);
  const percent = Math.min(100, Math.max(0, Number(progression?.progressPercent) || 0));
  const remaining = progression?.nextLevelGp != null ? Math.max(0, progression.nextLevelGp - totalGp) : null;
  const stats = profile.stats;
  const played = Number(stats?.matchesPlayed ?? (stats?.wins ?? 0) + (stats?.losses ?? 0));
  const rate = stats?.winRate != null ? Math.round(stats.winRate) : played ? Math.round(((stats?.wins ?? 0) / played) * 100) : null;
  const facts: Array<[string, string, boolean?]> = [
    ["Record", played ? `${stats?.wins ?? 0}–${stats?.losses ?? 0}` : "No matches"],
    ["Win rate", rate != null ? `${rate}%` : "—"],
    ["Tournament wins", String(stats?.tournamentWins ?? 0), Boolean(stats?.tournamentWins)],
    ["Streak", profile.streak ? `${profile.streak.currentStreak} days` : "—"],
  ];

  return (
    <section
      aria-label="Progression"
      className="relative overflow-hidden rounded-card bg-ink-900 p-5 ring-1 ring-inset ring-white/8 sm:p-7"
    >
      <div className="halftone absolute inset-0 text-lavender-400/8 mask-[radial-gradient(60%_90%_at_0%_0%,black,transparent)]" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <LevelRing level={level} percent={percent} />
        <div className="min-w-0 flex-1">
          <p className="type-display text-[2rem] leading-none tabular-nums">
            {totalGp.toLocaleString()}
            <span className="ml-1.5 text-base text-lavender-300">GP</span>
          </p>
          <p className="mt-2 text-sm text-mist-400">
            {remaining != null ? `${remaining.toLocaleString()} GP to level ${progression?.nextLevel}` : "Top level reached"}
            {profile.streak && profile.streak.longestStreak > 0 ? ` · longest streak ${profile.streak.longestStreak} days` : ""}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {facts.map(([label, value, highlight]) => (
              <div key={label}>
                <dt className="type-label text-mist-500">{label}</dt>
                <dd className={highlight ? "mt-1.5 font-semibold text-signal" : "mt-1.5 font-semibold"}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function memberInfo(team: TeamSummary, userId: string) {
  const member = team.members?.find((item) => item.userId === userId || item.user?.id === userId);
  const owner = isTeamOwner(team, userId);
  return {
    role: owner ? "Owner" : member?.role === "admin" ? "Admin" : "Member",
    title: member?.title && member.title !== "owner" ? member.title : null,
    joined: member?.joinedAt ? new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(member.joinedAt)) : null,
    owner,
  };
}

function Teams({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const teams = useUserTeams(profile.id);
  return (
    <ProfileSection title="Teams and roles" meta={teams.data?.length ? `${teams.data.length}` : undefined}>
      {teams.isLoading ? (
        <div aria-hidden="true" className="grid gap-3">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
      ) : teams.data?.length ? (
        <ul className="grid gap-1">
          {teams.data.map((team) => {
            const info = memberInfo(team, profile.id);
            return (
              <li key={team.id}>
                <Link
                  to={`/teams/${encodeURIComponent(team.slug || team.id)}`}
                  className="group -mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-white/3"
                >
                  <Avatar src={team.logo} name={team.name} tone="ink" className="rounded-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold group-hover:text-lavender-200">{team.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-mist-500">
                      {[info.title, info.joined ? `since ${info.joined}` : null, team.games?.[0]?.name].filter(Boolean).join(" · ") || "Team"}
                    </span>
                  </span>
                  <span
                    className={
                      info.owner
                        ? "type-label shrink-0 rounded-full bg-lavender-400/12 px-2.5 py-1 text-lavender-300"
                        : "type-label shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-mist-400"
                    }
                  >
                    {info.role}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid gap-3">
          <p className="text-sm leading-relaxed text-mist-400">
            {own ? "Teams you join or start show here with your role." : "Not on a team right now."}
          </p>
          {own && (
            <LinkButton to="/teams" tone="outline" size="sm" className="w-fit">
              Find a team
            </LinkButton>
          )}
        </div>
      )}
    </ProfileSection>
  );
}

export function ProfileCareer({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Progression profile={profile} />
      <TournamentHistory own={own} profile={profile} />
      <MarketValue own={own} profile={profile} />
      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <Teams own={own} profile={profile} />
        <Milestones own={own} profile={profile} />
      </div>
    </div>
  );
}
