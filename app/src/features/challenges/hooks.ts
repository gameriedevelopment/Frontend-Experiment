import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createChallenge,
  deleteChallenge,
  getChallenge,
  getEligibleLineupMembers,
  getMyChallenges,
  getPlayerChallenges,
  proposeReschedule,
  refreshChallenge,
  reportChallengeScore,
  respondReschedule,
  updateChallenge,
  updateTeamChallengeLineup,
  type ReportScorePayload,
} from "./api";
import type { Challenge, ChallengeFilters, ChallengeType, ChallengeUpdate, CreateChallengePayload } from "./types";

type Client = ReturnType<typeof useQueryClient>;

// A challenge change moves results, records, calendars, rankings and team wallets, so all of them refresh.
function reconcile(client: Client) {
  void client.invalidateQueries({ queryKey: ["challenges"] });
  void client.invalidateQueries({ queryKey: ["player-matches"] });
  void client.invalidateQueries({ queryKey: ["calendar-events"] });
  void client.invalidateQueries({ queryKey: ["user-events"] });
  void client.invalidateQueries({ queryKey: ["team-wallet"] });
  void client.invalidateQueries({ queryKey: ["player-rankings"] });
  void client.invalidateQueries({ queryKey: ["leaderboard"] });
  void client.invalidateQueries({ queryKey: ["progression-guide"] });
}

function storeAndReconcile(client: Client, challenge: Challenge) {
  client.setQueryData(["challenges", "detail", challenge.id], challenge);
  reconcile(client);
}

export function useMyChallenges(filters: ChallengeFilters) {
  return useInfiniteQuery({
    queryKey: ["challenges", "mine", filters],
    queryFn: ({ pageParam }) => getMyChallenges(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.hasMore ? page.page + 1 : undefined),
    staleTime: 30_000,
  });
}

/** First page only, for summaries. The key sits under ["challenges", "mine"] so challenge mutations refresh it too. */
export function useChallengeSummary(filters: ChallengeFilters, enabled = true) {
  return useQuery({
    queryKey: ["challenges", "mine", "summary", filters],
    queryFn: () => getMyChallenges(filters, 1),
    enabled,
    staleTime: 30_000,
  });
}

export function usePlayerChallenges(userId?: string) {
  return useInfiniteQuery({
    queryKey: ["challenges", "player", userId],
    queryFn: ({ pageParam }) => getPlayerChallenges(userId!, pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.hasMore ? page.page + 1 : undefined),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export function useChallenge(id?: string) {
  return useQuery({
    queryKey: ["challenges", "detail", id],
    queryFn: () => getChallenge(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useEligibleLineupMembers(teamId?: string, enabled = true) {
  return useQuery({
    queryKey: ["challenges", "eligible-lineup", teamId],
    queryFn: () => getEligibleLineupMembers(teamId!),
    enabled: Boolean(teamId) && enabled,
    staleTime: 30_000,
  });
}

export function useUpdateTeamChallengeLineup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, teamId, playerIds }: { challengeId: string; teamId: string; playerIds: string[] }) =>
      updateTeamChallengeLineup(challengeId, teamId, playerIds),
    onSuccess: (challenge) => storeAndReconcile(client, challenge),
  });
}

export function useCreateChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChallengePayload) => createChallenge(payload),
    onSuccess: (challenge) => storeAndReconcile(client, challenge),
  });
}

export function useUpdateChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, updates }: { id: string; type: ChallengeType; updates: ChallengeUpdate }) =>
      updateChallenge(id, type, updates),
    onSuccess: (challenge) => storeAndReconcile(client, challenge),
  });
}

export function useRefreshChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, scheduledDate }: { id: string; type: ChallengeType; scheduledDate: string }) =>
      refreshChallenge(id, type, scheduledDate),
    onSuccess: (challenge) => storeAndReconcile(client, challenge),
  });
}

export function useProposeReschedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, scheduledDate }: { id: string; type: ChallengeType; scheduledDate: string }) =>
      proposeReschedule(id, type, scheduledDate),
    onSuccess: (challenge) => storeAndReconcile(client, challenge),
  });
}

export function useRespondReschedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, accept }: { id: string; type: ChallengeType; accept: boolean }) =>
      respondReschedule(id, type, accept),
    onSuccess: (challenge) => storeAndReconcile(client, challenge),
  });
}

export function useReportChallengeScore() {
  return useMutation({ mutationFn: (payload: ReportScorePayload) => reportChallengeScore(payload) });
}

export function useDeleteChallenge() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: ChallengeType }) => deleteChallenge(id, type),
    onSuccess: (_result, { id }) => {
      client.removeQueries({ queryKey: ["challenges", "detail", id] });
      reconcile(client);
    },
  });
}
