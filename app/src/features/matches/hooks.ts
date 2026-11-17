import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlayerMatchPage } from "@/features/profile/api";
import { confirmMatchSubmission, getMatchEvidence, getMatchSubmission, processMatchSubmission, reviewMatchSubmission } from "./api";
import type { MatchReviewInput } from "./types";

const submissionKey = (id?: string) => ["match-submission", id] as const;

/** One numbered page of a player's record, keeping the last page on screen while the next loads. */
export function usePlayerMatchPage(userId: string | undefined, page: number, limit = 20) {
  return useQuery({
    queryKey: ["player-matches", userId, "page", page, limit],
    queryFn: () => getPlayerMatchPage(userId!, page, limit),
    enabled: Boolean(userId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useMatchSubmission(id?: string) {
  return useQuery({
    queryKey: submissionKey(id),
    queryFn: () => getMatchSubmission(id!),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.status === "processing" ? 2_000 : false),
  });
}

export function useMatchEvidence(id?: string, enabled = true) {
  return useQuery({
    queryKey: ["match-evidence", id],
    queryFn: () => getMatchEvidence(id!),
    enabled: Boolean(id) && enabled,
    staleTime: Infinity,
  });
}

export function useProcessMatchSubmission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: processMatchSubmission,
    onSuccess: (submission) => client.setQueryData(submissionKey(submission.id), submission),
  });
}

export function useReviewMatchSubmission(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: MatchReviewInput) => reviewMatchSubmission(id!, input),
    onSuccess: (submission) => client.setQueryData(submissionKey(submission.id), submission),
  });
}

export function useConfirmMatchSubmission(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => confirmMatchSubmission(id!),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: submissionKey(id) });
      void client.invalidateQueries({ queryKey: ["player-matches"] });
      void client.invalidateQueries({ queryKey: ["player-profile"] });
      void client.invalidateQueries({ queryKey: ["progression-guide"] });
      void client.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
