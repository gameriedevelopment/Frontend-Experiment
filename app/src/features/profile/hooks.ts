import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { syncUserWithBackend } from "@/features/auth/api";
import {
  claimAchievement,
  followPlayer,
  getAchievements,
  getMyReferrals,
  getPlayerPosts,
  getSkillEndorsers,
  getPlayerConnections,
  getPlayerMatchPage,
  getPlayerProfile,
  getPlayerRankings,
  getPublicPlayerCard,
  getSalaryEstimation,
  getSalaryHistory,
  notifySkillEndorsement,
  recalculateSalary,
  toggleSkillEndorsement,
  unfollowPlayer,
  updatePlayerProfile,
  uploadPlayerImage,
} from "./api";
import { updatePlayerFollowCache } from "./followCache";
import type { ConnectionPage } from "./types";

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
      const followersKey = ["player-connections", profileId, "followers"];
      await client.cancelQueries({ queryKey: followersKey });
      const followersSnapshot = client.getQueryData<InfiniteData<ConnectionPage>>(followersKey);
      if (followersSnapshot?.pages.length) {
        const [first, ...rest] = followersSnapshot.pages;
        client.setQueryData<InfiniteData<ConnectionPage>>(followersKey, {
          ...followersSnapshot,
          pages: [{ ...first, total: Math.max(0, first.total + (following ? -1 : 1)) }, ...rest],
        });
        snapshots.push([followersKey, followersSnapshot]);
      }
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

export function useUpdatePlayerProfile(userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (updates: Parameters<typeof updatePlayerProfile>[1]) => updatePlayerProfile(userId!, updates),
    onSuccess: async (profile) => {
      client.setQueryData(["player-profile", profile.username], profile);
      client.setQueryData(["player-profile", profile.id], profile);
      await client.invalidateQueries({ queryKey: ["player-profile"] });
      void client.invalidateQueries({ queryKey: ["progression-guide"] });
      await syncUserWithBackend();
    },
  });
}

export function useUploadPlayerImage(userId?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: "profileImage" | "backgroundImage" }) => uploadPlayerImage(userId!, file, type),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["player-profile"] });
      void client.invalidateQueries({ queryKey: ["progression-guide"] });
      await syncUserWithBackend();
    },
  });
}

export function useMyReferrals(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["my-referrals"],
    queryFn: ({ pageParam }) => getMyReferrals(pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.pagination.page < page.pagination.totalPages ? page.pagination.page + 1 : undefined),
    enabled,
    staleTime: 60_000,
  });
}

export function usePlayerPosts(userId: string) {
  return useQuery({
    queryKey: ["wall-posts", userId],
    queryFn: () => getPlayerPosts(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useSkillEndorsers(userId: string, skillId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["skill-endorsers", userId, skillId],
    queryFn: ({ pageParam }) => getSkillEndorsers(userId, skillId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    enabled: Boolean(userId && skillId) && enabled,
    staleTime: 60_000,
  });
}

export function useSalaryInsights(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["salary-insights", userId],
    queryFn: () => getSalaryEstimation(userId),
    enabled: Boolean(userId) && enabled,
    staleTime: 5 * 60_000,
  });
}

export function useSalaryHistory(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["salary-history", userId],
    queryFn: () => getSalaryHistory(userId),
    enabled: Boolean(userId) && enabled,
    staleTime: 5 * 60_000,
  });
}

export function useRecalculateSalary(userId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => recalculateSalary(userId),
    onSuccess: (data) => {
      client.setQueryData(["salary-insights", userId], data);
      client.invalidateQueries({ queryKey: ["salary-history", userId] });
    },
  });
}
