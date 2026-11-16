import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHubInvites, getTeamInvites, getUserTeams, respondToInvite } from "./api";
import { isTeamOwner } from "./ownership";
import type { CommunityKind } from "./types";

const refreshMembershipCaches = (client: ReturnType<typeof useQueryClient>) => {
  void client.invalidateQueries({ queryKey: ["profile-teams"] });
  void client.invalidateQueries({ queryKey: ["user-teams"] });
  void client.invalidateQueries({ queryKey: ["user-hubs"] });
  void client.invalidateQueries({ queryKey: ["hub-members"] });
  void client.invalidateQueries({ queryKey: ["player-profile"] });
};

export function useUserTeams(userId?: string, enabled = true) {
  return useQuery({
    queryKey: ["user-teams", userId],
    queryFn: () => getUserTeams(userId!),
    enabled: Boolean(userId) && enabled,
    staleTime: 45_000,
  });
}

/** Teams the user owns. Only owners can send or answer team challenges. */
export function useOwnedTeams(userId?: string) {
  const teams = useUserTeams(userId);
  const owned = useMemo(
    () => (userId ? (teams.data ?? []).filter((team) => isTeamOwner(team, userId)) : []),
    [teams.data, userId],
  );
  return { ...teams, owned };
}

export function useCommunityInvites(kind: "teams" | "hubs", enabled = true) {
  return useQuery({
    queryKey: [kind, "invites", "mine"],
    queryFn: kind === "teams" ? getTeamInvites : getHubInvites,
    enabled,
    staleTime: 30_000,
  });
}

export function useRespondInvite(kind: CommunityKind) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) => respondToInvite(kind, id, accept),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: [`${kind}s`, "invites", "mine"] });
      refreshMembershipCaches(client);
      void client.invalidateQueries({ queryKey: [kind] });
      void client.invalidateQueries({ queryKey: [kind === "hub" ? "hubs" : "teams"] });
      void client.invalidateQueries({ queryKey: [kind, "detail"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
