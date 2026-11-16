import type { TeamSummary } from "./types";

/** The teams endpoint marks ownership in a few ways depending on the record's age; accept any of them. */
export function isTeamOwner(team: TeamSummary, userId: string) {
  return (
    team.ownerId === userId ||
    team.role === "owner" ||
    team.title === "owner" ||
    Boolean(
      team.members?.some(
        (member) => (member.userId === userId || member.user?.id === userId) && member.role === "owner",
      ),
    )
  );
}
