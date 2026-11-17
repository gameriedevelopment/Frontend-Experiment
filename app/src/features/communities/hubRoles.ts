import type { CommunityMember, HubDesignation, HubMemberFilter, HubRoleSummary } from "./types";

export const DESIGNATION_LABELS: Record<HubDesignation, string> = {
  partner: "Partner",
  official_member: "Official member",
  honorary_member: "Honorary member",
};

const ACCESS_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Co-owner",
  manager: "Manager",
};

/** Every role a member holds, leadership first. Someone with none is a Hub member. */
export function hubMemberRoles(member: CommunityMember, ownerId?: string): string[] {
  const roles: string[] = [];
  const access =
    member.user?.id && member.user.id === ownerId ? "Owner" : ACCESS_LABELS[member.role ?? ""];
  if (access) roles.push(access);
  if (member.teamRole) {
    const team = member.teams?.[0]?.name;
    roles.push(
      `${member.teamRole === "leader" ? "Team leader" : "Team member"}${team ? ` · ${team}` : ""}`,
    );
  }
  if (member.designation) roles.push(DESIGNATION_LABELS[member.designation]);
  return roles.length ? roles : ["Hub member"];
}

/** Roles grouped the way an owner thinks about them, with the count for each group. */
export const HUB_ROLE_GROUPS: Array<{
  filter: HubMemberFilter;
  label: string;
  description: string;
  count: (summary: HubRoleSummary) => number;
}> = [
  {
    filter: "leadership",
    label: "Leadership",
    description: "Owner, co-owners and managers",
    count: (summary) => summary.owner + summary.coOwners + summary.managers,
  },
  {
    filter: "team",
    label: "Teams",
    description: "Team leaders and members, from the hub's teams",
    count: (summary) => summary.teamLeaders + summary.teamMembers,
  },
  {
    filter: "community",
    label: "Community",
    description: "Partners, official and honorary members",
    count: (summary) => summary.partners + summary.officialMembers + summary.honoraryMembers,
  },
  {
    filter: "unassigned",
    label: "No role yet",
    description: "Members without any role",
    count: (summary) => summary.unassigned,
  },
];
