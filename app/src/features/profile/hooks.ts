import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { syncUserWithBackend } from "@/features/auth/api";
import {
  claimAchievement,
  followPlayer,
  getAchievements,
  getPlayerConnections,
  getPlayerMatchPage,
  getPlayerProfile,
  getPlayerRankings,
  getPublicPlayerCard,
  notifySkillEndorsement,
  toggleSkillEndorsement,
  unfollowPlayer,
} from "./api";
import { updatePlayerFollowCache } from "./followCache";

export function usePlayerProfile(identity?: string) {
  return useQuery({
    queryKey: ["player-profile", identity],
    queryFn: () => getPlayerProfile(identity!),
    enabled: Boolean(identity),
    retry: 2,
    staleTime: 60_000,
  });
}

export function usePublicPlayerCard(username?: string) {
  return useQuery({
    queryKey: ["public-player-card", username],
    queryFn: () => getPublicPlayerCard(username!),
    enabled: Boolean(username),
    retry: 1,
    staleTime: 60_000,
  });
}

export function usePlayerConnections(
  userId: string,
  kind: "followers" | "following",
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: ["player-connections", userId, kind],
    queryFn: ({ pageParam }) => getPlayerConnections(userId, kind, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled: Boolean(userId) && enabled,
    staleTime: 60_000,
  });
}

export function useTogglePlayerFollow(
  currentUserId: string | undefined,
  profileId: string,
  following: boolean,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!currentUserId) throw new Error("Your session could not be resolved.");
      return following
        ? unfollowPlayer(currentUserId, profileId)
        : followPlayer(currentUserId, profileId);
    },
    onMutate: async () => {
      const queryKeys = [["player-profile"], ["discovery-players"], ["unified-search"]] as const;
      await Promise.all(
        queryKeys.map((queryKey) => client.cancelQueries({ queryKey: [...queryKey] })),
      );
      const snapshots = queryKeys.flatMap((queryKey) =>
        client.getQueriesData({ queryKey: [...queryKey] }),
      );
      queryKeys.forEach((queryKey) =>
        client.setQueriesData({ queryKey: [...queryKey] }, (value: unknown) =>
          updatePlayerFollowCache(value, profileId, following),
        ),
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) =>
      context?.snapshots.forEach(([key, value]) => client.setQueryData(key, value)),
    onSettled: () => {
      client.invalidateQueries({ queryKey: ["player-profile"] });
      client.invalidateQueries({ queryKey: ["player-connections"] });
      client.invalidateQueries({ queryKey: ["discovery-players"] });
      client.invalidateQueries({ queryKey: ["unified-search", "players"] });
    },
  });
}

export function usePlayerRankings(userId: string) {
  return useQuery({
    queryKey: ["player-rankings", userId],
    queryFn: () => getPlayerRankings(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function usePlayerMatchHistory(userId?: string) {
  return useInfiniteQuery({
    queryKey: ["player-matches", userId, "history", "standalone"],
    queryFn: ({ pageParam }) => getPlayerMatchPage(userId!, pageParam, 10, "standalone"),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export function useToggleSkillEndorsement(endorserId: string | undefined, endorsedId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      skillId,
      skillName,
      alreadyEndorsed,
    }: {
      skillId?: string;
      skillName: string;
      alreadyEndorsed: boolean;
    }) => {
      if (!endorserId) throw new Error("Your session could not be resolved.");
      const result = await toggleSkillEndorsement(endorserId, endorsedId, skillName);
      if (!alreadyEndorsed && skillId && endorserId !== endorsedId)
        notifySkillEndorsement({
          userId: endorserId,
          targetId: endorsedId,
          contentId: skillId,
        }).catch(() => undefined);
      return result;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["player-profile"] });
      client.invalidateQueries({ queryKey: ["skill-endorsers", endorsedId] });
    },
  });
}

export function useAchievements(userId: string) {
  return useQuery({
    queryKey: ["achievements", userId],
    queryFn: () => getAchievements(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useClaimAchievement(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (achievementId: string) => claimAchievement(userId, achievementId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["achievements", userId] }),
        client.invalidateQueries({ queryKey: ["player-profile"] }),
      ]);
      await syncUserWithBackend();
    },
  });
}
