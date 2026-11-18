import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { connectMessagingSocket } from "@/features/messages/api";
import * as laddersApi from "./api";
import type {
  LadderBasicsInput,
  LadderEntryInput,
  LadderFilters,
  LadderRoster,
  SaveLadderDraftInput,
  UpdateLadderInput,
} from "./types";

export const ladderKeys = {
  all: ["ladders"] as const,
  directory: (filters: LadderFilters) => ["ladders", "directory", filters] as const,
  detail: (id: string) => ["ladders", "detail", id] as const,
  hostingOptions: ["ladders", "hosting-options"] as const,
  participants: (id: string, manage = false) =>
    ["ladders", id, manage ? "entries" : "participants"] as const,
  standings: (id: string) => ["ladders", id, "standings"] as const,
  matches: (id: string) => ["ladders", id, "matches"] as const,
  groups: (id: string) => ["ladders", id, "groups"] as const,
  announcements: (id: string) => ["ladders", id, "announcements"] as const,
  activity: (id: string) => ["ladders", id, "activity"] as const,
  leaderboard: (kind: "player" | "team", game?: string) =>
    ["ladders", "leaderboard", kind, game ?? ""] as const,
};

export function useLadders(filters: LadderFilters) {
  return useInfiniteQuery({
    queryKey: ladderKeys.directory(filters),
    queryFn: ({ pageParam }) => laddersApi.getLadders(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.hasMore ? page.page + 1 : undefined),
    staleTime: 30_000,
  });
}

export function useLadderParticipants(
  id?: string,
  manage = false,
  status?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [...ladderKeys.participants(id ?? "", manage), status],
    queryFn: () => laddersApi.getLadderParticipants(id!, manage, status),
    enabled: Boolean(id) && enabled,
    staleTime: 10_000,
  });
}

export function useLadderStandings(id?: string) {
  return useQuery({
    queryKey: ladderKeys.standings(id ?? ""),
    queryFn: () => laddersApi.getLadderStandings(id!),
    enabled: Boolean(id),
    staleTime: 10_000,
  });
}

/** Matches refresh on a timer only while the ladder is running; finished ladders don't change. */
export function useLadderMatches(id?: string, live = true) {
  return useQuery({
    queryKey: ladderKeys.matches(id ?? ""),
    queryFn: () => laddersApi.getLadderMatches(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
    refetchInterval: live ? 15_000 : false,
  });
}

export function useLadderAction(id?: string) {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ladderKeys.detail(id ?? "") });
    void client.invalidateQueries({ queryKey: ["ladders", id] });
  };
  return {
    join: useMutation({
      mutationFn: (input: LadderEntryInput = {}) => laddersApi.joinLadder(id!, input),
      onSuccess: refresh,
    }),
    invitation: useMutation({
      mutationFn: ({
        participantId,
        action,
        input = {},
      }: {
        participantId: string;
        action: "accept" | "decline";
        input?: LadderEntryInput;
      }) => laddersApi.respondToLadderInvitation(id!, participantId, action, input),
      onSuccess: refresh,
    }),
    withdraw: useMutation({
      mutationFn: (participantId: string) =>
        laddersApi.withdrawLadderParticipant(id!, participantId),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (participantId: string) => laddersApi.removeLadderParticipant(id!, participantId),
      onSuccess: refresh,
    }),
    invite: useMutation({
      mutationFn: (targetId: string) => laddersApi.inviteLadderParticipant(id!, targetId),
      onSuccess: refresh,
    }),
    challenge: useMutation({
      mutationFn: laddersApi.createLadderChallenge.bind(null, id!),
      onSuccess: refresh,
    }),
    respond: useMutation({
      mutationFn: ({ challengeId, action }: { challengeId: string; action: "accept" | "reject" }) =>
        laddersApi.respondToLadderChallenge(id!, challengeId, action),
      onSuccess: refresh,
    }),
    result: useMutation({
      mutationFn: ({
        challengeId,
        input,
      }: {
        challengeId: string;
        input: Parameters<typeof laddersApi.declareLadderResult>[2];
      }) => laddersApi.declareLadderResult(id!, challengeId, input),
      onSuccess: refresh,
    }),
    reviewResult: useMutation({
      mutationFn: ({
        challengeId,
        action,
      }: {
        challengeId: string;
        action: "accept" | "dispute";
      }) => laddersApi.reviewLadderResult(id!, challengeId, action),
      onSuccess: refresh,
    }),
    reviewEntry: useMutation({
      mutationFn: ({
        participantId,
        action,
      }: {
        participantId: string;
        action: "approve" | "decline";
      }) => laddersApi.reviewLadderEntry(id!, participantId, action),
      onSuccess: refresh,
    }),
  };
}

export function useLadderGroups(id?: string, enabled = true) {
  return useQuery({
    queryKey: ladderKeys.groups(id ?? ""),
    queryFn: () => laddersApi.getLadderGroups(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useLadderAnnouncements(id?: string, enabled = true) {
  return useQuery({
    queryKey: ladderKeys.announcements(id ?? ""),
    queryFn: () => laddersApi.getLadderAnnouncements(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useLadderActivity(id?: string, enabled = true) {
  return useQuery({
    queryKey: ladderKeys.activity(id ?? ""),
    queryFn: () => laddersApi.getLadderActivity(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useLadderStaff(id?: string, enabled = true) {
  return useQuery({
    queryKey: ["ladders", id, "staff"],
    queryFn: () => laddersApi.getLadderStaff(id!),
    enabled: Boolean(id) && enabled,
    staleTime: 15_000,
  });
}

export function useLadderManagement(id?: string) {
  const client = useQueryClient();
  const refresh = () => void client.invalidateQueries({ queryKey: ["ladders", id] });
  return {
    assignGroups: useMutation({
      mutationFn: (assignments: Array<{ participantId: string; groupId: string }>) =>
        laddersApi.assignLadderGroups(id!, assignments),
      onSuccess: refresh,
    }),
    randomizeGroups: useMutation({
      mutationFn: () => laddersApi.randomizeLadderGroups(id!),
      onSuccess: refresh,
    }),
    announce: useMutation({
      mutationFn: (input: { title?: string; message: string }) =>
        laddersApi.postLadderAnnouncement(id!, input),
      onSuccess: refresh,
    }),
    setStaff: useMutation({
      mutationFn: ({ userId, role }: { userId: string; role: "manager" | "moderator" }) => laddersApi.setLadderStaff(id!, userId, role),
      onSuccess: refresh,
    }),
    removeStaff: useMutation({
      mutationFn: (userId: string) => laddersApi.removeLadderStaff(id!, userId),
      onSuccess: () => void client.invalidateQueries({ queryKey: ["ladders"] }),
    }),
    // Edits change list cards too, so every ladder query refreshes.
    update: useMutation({
      mutationFn: (input: UpdateLadderInput) => laddersApi.updateLadder(id!, input),
      onSuccess: () => void client.invalidateQueries({ queryKey: ["ladders"] }),
    }),
    uploadBanner: useMutation({
      mutationFn: (file: File) => laddersApi.uploadLadderBanner(id!, file),
      onSuccess: () => void client.invalidateQueries({ queryKey: ["ladders"] }),
    }),
    uploadLogo: useMutation({
      mutationFn: (file: File) => laddersApi.uploadLadderLogo(id!, file),
      onSuccess: () => void client.invalidateQueries({ queryKey: ["ladders"] }),
    }),
    runAgain: useMutation({
      mutationFn: () => laddersApi.runLadderAgain(id!),
      onSuccess: () => void client.invalidateQueries({ queryKey: ["ladders"] }),
    }),
  };
}

/** Finished ladders on a player's or team's profile. */
export function useLadderFinishes(subject: { userId: string } | { teamId: string } | null) {
  return useQuery({
    queryKey: ["ladders", "finishes", subject],
    queryFn: () => laddersApi.getLadderFinishes(subject!),
    enabled: Boolean(subject),
    staleTime: 5 * 60_000,
  });
}

export function useHostedLadders(hubId?: string) {
  return useQuery({
    queryKey: ["ladders", "hosted-by", hubId],
    queryFn: () => laddersApi.getHostedLadders(hubId!),
    enabled: Boolean(hubId),
    staleTime: 5 * 60_000,
  });
}

export function useLadderRoster(id: string, participantId?: string) {
  const client = useQueryClient();
  const key = ["ladders", id, "roster", participantId];
  const update = (roster: LadderRoster) => client.setQueryData(key, roster);
  return {
    query: useQuery({
      queryKey: key,
      queryFn: () => laddersApi.getLadderRoster(id, participantId!),
      enabled: Boolean(participantId),
    }),
    add: useMutation({
      mutationFn: (input: { userId: string; role: "player" | "substitute" }) =>
        laddersApi.addLadderRosterMember(id, participantId!, input),
      onSuccess: update,
    }),
    remove: useMutation({
      mutationFn: (userId: string) => laddersApi.removeLadderRosterMember(id, participantId!, userId),
      onSuccess: update,
    }),
  };
}

export function useLadderLeaderboard(kind: "player" | "team", game?: string) {
  return useInfiniteQuery({
    queryKey: ladderKeys.leaderboard(kind, game),
    queryFn: ({ pageParam }) => laddersApi.getLadderLeaderboard(kind, game, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: 60_000,
  });
}

/** Refreshes the ladder and everything under it (standings, matches, entries) when it changes. */
export function useLadderRealtime(id?: string) {
  const client = useQueryClient();
  useEffect(() => {
    if (!id) return;
    const socket = connectMessagingSocket();
    const join = () => socket.emit("ladder.join", { ladderId: id });
    const refresh = (event: { ladderId?: string }) => {
      if (event?.ladderId !== id) return;
      void client.invalidateQueries({ queryKey: ["ladders", id] });
      void client.invalidateQueries({ queryKey: ladderKeys.detail(id) });
    };
    join();
    socket.on("connect", join);
    socket.on("ladder.updated", refresh);
    return () => {
      socket.emit("ladder.leave", { ladderId: id });
      socket.off("connect", join);
      socket.off("ladder.updated", refresh);
    };
  }, [client, id]);
}

export function useLadder(id?: string) {
  return useQuery({
    queryKey: ladderKeys.detail(id ?? ""),
    queryFn: () => laddersApi.getLadder(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
    // Without a live socket here yet, a running ladder refreshes on a short timer.
    refetchInterval: (query) => (query.state.data?.status === "in_progress" ? 20_000 : false),
  });
}

export function useLadderHostingOptions(enabled = true) {
  return useQuery({
    queryKey: ladderKeys.hostingOptions,
    queryFn: laddersApi.getLadderHostingOptions,
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateLadderDraft() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (basics: LadderBasicsInput) => laddersApi.createLadderDraft(basics),
    onSuccess: (ladder) => {
      client.setQueryData(ladderKeys.detail(ladder.id), ladder);
      void client.invalidateQueries({ queryKey: ladderKeys.all });
    },
  });
}

export function useSaveLadderDraft(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveLadderDraftInput) => laddersApi.saveLadderDraft(id!, input),
    onSuccess: (ladder) => {
      client.setQueryData(ladderKeys.detail(ladder.id), ladder);
      void client.invalidateQueries({ queryKey: ladderKeys.all });
    },
  });
}

export function usePublishLadder(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => laddersApi.publishLadder(id!),
    onSuccess: (ladder) => {
      client.setQueryData(ladderKeys.detail(ladder.id), ladder);
      void client.invalidateQueries({ queryKey: ladderKeys.all });
    },
  });
}
