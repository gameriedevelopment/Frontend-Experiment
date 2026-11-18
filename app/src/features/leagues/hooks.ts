import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { connectMessagingSocket } from "@/features/messages/api";
import * as leaguesApi from "./api";
import type { LeagueBasicsInput, LeagueEntryInput, LeagueFilters, LeagueParticipantStatus, SaveLeagueDraftInput, UpdateLeagueInput } from "./types";

export const leagueKeys = {
  all: ["leagues"] as const,
  directory: (filters: LeagueFilters) => ["leagues", "directory", filters] as const,
  detail: (id: string, seasonId?: string) => ["leagues", "detail", id, seasonId ?? "current"] as const,
  hostingOptions: ["leagues", "hosting-options"] as const,
  season: (id: string, seasonId: string) => ["leagues", id, seasonId] as const,
  seasons: (id: string) => ["leagues", id, "seasons"] as const,
  announcements: (id: string) => ["leagues", id, "announcements"] as const,
  activity: (id: string) => ["leagues", id, "activity"] as const,
  finishes: (subject: string) => ["leagues", "finishes", subject] as const,
  leaderboard: (kind: "player" | "team", game?: string) => ["leagues", "leaderboard", kind, game ?? ""] as const,
};

export function useLeagues(filters: LeagueFilters) {
  return useInfiniteQuery({
    queryKey: leagueKeys.directory(filters),
    queryFn: ({ pageParam }) => leaguesApi.getLeagues(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page < page.totalPages ? page.page + 1 : undefined),
    staleTime: 30_000,
  });
}

export function useLeague(id?: string, seasonId?: string) {
  return useQuery({
    queryKey: leagueKeys.detail(id ?? "", seasonId),
    queryFn: () => leaguesApi.getLeague(id!, seasonId),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useLeagueHostingOptions(enabled = true) {
  return useQuery({
    queryKey: leagueKeys.hostingOptions,
    queryFn: leaguesApi.getLeagueHostingOptions,
    enabled,
    staleTime: 60_000,
  });
}

export function useLeagueSeasons(id?: string) {
  return useQuery({
    queryKey: leagueKeys.seasons(id ?? ""),
    queryFn: () => leaguesApi.getLeagueSeasons(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useLeagueParticipants(id?: string, seasonId?: string, status?: LeagueParticipantStatus[]) {
  return useQuery({
    queryKey: [...leagueKeys.season(id ?? "", seasonId ?? ""), "participants", status?.join(",") ?? ""],
    queryFn: () => leaguesApi.getLeagueParticipants(id!, seasonId!, status),
    enabled: Boolean(id && seasonId),
    staleTime: 10_000,
  });
}

export function useLeagueStandings(id?: string, seasonId?: string) {
  return useQuery({
    queryKey: [...leagueKeys.season(id ?? "", seasonId ?? ""), "standings"],
    queryFn: () => leaguesApi.getLeagueStandings(id!, seasonId!),
    enabled: Boolean(id && seasonId),
    staleTime: 10_000,
  });
}

export function useLeagueFixtures(id?: string, seasonId?: string, live = false) {
  return useQuery({
    queryKey: [...leagueKeys.season(id ?? "", seasonId ?? ""), "fixtures"],
    queryFn: () => leaguesApi.getLeagueFixtures(id!, seasonId!),
    enabled: Boolean(id && seasonId),
    staleTime: 15_000,
    refetchInterval: live ? 30_000 : false,
  });
}

export function useLeaguePlayoffs(id?: string, seasonId?: string, enabled = true) {
  return useQuery({
    queryKey: [...leagueKeys.season(id ?? "", seasonId ?? ""), "playoffs"],
    queryFn: () => leaguesApi.getLeaguePlayoffs(id!, seasonId!),
    enabled: Boolean(id && seasonId) && enabled,
    staleTime: 15_000,
  });
}

export function useLeagueGroups(id?: string, seasonId?: string, enabled = true) {
  return useQuery({
    queryKey: [...leagueKeys.season(id ?? "", seasonId ?? ""), "groups"],
    queryFn: () => leaguesApi.getLeagueGroups(id!, seasonId!),
    enabled: Boolean(id && seasonId) && enabled,
    staleTime: 15_000,
  });
}

export function useLeagueReports(id?: string, seasonId?: string, enabled = true) {
  return useQuery({
    queryKey: [...leagueKeys.season(id ?? "", seasonId ?? ""), "reports"],
    queryFn: () => leaguesApi.getLeagueReports(id!, seasonId!),
    enabled: Boolean(id && seasonId) && enabled,
    staleTime: 15_000,
  });
}

export function useLeagueRoster(id?: string, seasonId?: string, participantId?: string) {
  return useQuery({
    queryKey: [...leagueKeys.season(id ?? "", seasonId ?? ""), "roster", participantId ?? ""],
    queryFn: () => leaguesApi.getLeagueRoster(id!, seasonId!, participantId!),
    enabled: Boolean(id && seasonId && participantId),
    staleTime: 15_000,
  });
}

export function useLeagueAnnouncements(id?: string) {
  return useQuery({
    queryKey: leagueKeys.announcements(id ?? ""),
    queryFn: () => leaguesApi.getLeagueAnnouncements(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useLeagueActivity(id?: string, enabled = true) {
  return useQuery({
    queryKey: leagueKeys.activity(id ?? ""),
    queryFn: () => leaguesApi.getLeagueActivity(id!),
    enabled: Boolean(id) && enabled,
    staleTime: 15_000,
  });
}

export function useLeagueFinishes(subject?: { userId: string } | { teamId: string }) {
  const key = subject ? ("userId" in subject ? `user:${subject.userId}` : `team:${subject.teamId}`) : "";
  return useQuery({
    queryKey: leagueKeys.finishes(key),
    queryFn: () => leaguesApi.getLeagueFinishes(subject!),
    enabled: Boolean(key),
    staleTime: 60_000,
  });
}

export function useHostedLeagueSeasons(hubId?: string) {
  return useQuery({
    queryKey: leagueKeys.finishes(`hub:${hubId ?? ""}`),
    queryFn: () => leaguesApi.getHostedLeagueSeasons(hubId!),
    enabled: Boolean(hubId),
    staleTime: 60_000,
  });
}

export function useLeagueLeaderboard(kind: "player" | "team", game?: string) {
  return useInfiniteQuery({
    queryKey: leagueKeys.leaderboard(kind, game),
    queryFn: ({ pageParam }) => leaguesApi.getLeagueLeaderboard(kind, game, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page * page.limit < page.total ? page.page + 1 : undefined),
    staleTime: 60_000,
  });
}

/** Everything a player does on a league page; each success refreshes the league. */
export function useLeagueActions(id?: string, seasonId?: string) {
  const client = useQueryClient();
  const refresh = () => void client.invalidateQueries({ predicate: (query) => query.queryKey[0] === "leagues" && query.queryKey.includes(id) });
  const leagueId = id ?? "";
  const season = seasonId ?? "";
  return {
    join: useMutation({ mutationFn: (input: LeagueEntryInput) => leaguesApi.joinLeague(leagueId, season, input), onSuccess: refresh }),
    respond: useMutation({
      mutationFn: ({ participantId, action, input = {} }: { participantId: string; action: "accept" | "decline"; input?: LeagueEntryInput }) =>
        leaguesApi.respondToLeagueInvitation(leagueId, season, participantId, { ...input, action }),
      onSuccess: refresh,
    }),
    withdraw: useMutation({ mutationFn: (participantId: string) => leaguesApi.withdrawFromLeague(leagueId, season, participantId), onSuccess: refresh }),
    fixture: useMutation({
      mutationFn: ({ fixtureId, action }: { fixtureId: string; action: leaguesApi.LeagueFixtureAction }) =>
        leaguesApi.actOnLeagueFixture(leagueId, season, fixtureId, action),
      onSuccess: refresh,
    }),
    addToRoster: useMutation({
      mutationFn: ({ participantId, userId, role }: { participantId: string; userId: string; role: "player" | "substitute" }) =>
        leaguesApi.addLeagueRosterMember(leagueId, season, participantId, { userId, role }),
      onSuccess: refresh,
    }),
    removeFromRoster: useMutation({
      mutationFn: ({ participantId, userId }: { participantId: string; userId: string }) =>
        leaguesApi.removeLeagueRosterMember(leagueId, season, participantId, userId),
      onSuccess: refresh,
    }),
  };
}

/** Organiser tools on the Manage tab. */
export function useLeagueManagement(id?: string, seasonId?: string) {
  const client = useQueryClient();
  const refresh = () => void client.invalidateQueries({ predicate: (query) => query.queryKey[0] === "leagues" && query.queryKey.includes(id) });
  const leagueId = id ?? "";
  const season = seasonId ?? "";
  return {
    review: useMutation({
      mutationFn: ({ participantId, approve }: { participantId: string; approve: boolean }) =>
        leaguesApi.reviewLeagueEntry(leagueId, season, participantId, approve),
      onSuccess: refresh,
    }),
    invite: useMutation({ mutationFn: (targetId: string) => leaguesApi.inviteToLeague(leagueId, season, targetId), onSuccess: refresh }),
    remove: useMutation({
      mutationFn: ({ participantId, mode, reason }: { participantId: string; mode: "void" | "forfeit_rest"; reason: string }) =>
        leaguesApi.removeLeagueParticipant(leagueId, season, participantId, { mode, reason }),
      onSuccess: refresh,
    }),
    assignGroups: useMutation({
      mutationFn: (assignments: Array<{ participantId: string; groupId: string }>) => leaguesApi.assignLeagueGroups(leagueId, season, assignments),
      onSuccess: refresh,
    }),
    randomizeGroups: useMutation({ mutationFn: () => leaguesApi.randomizeLeagueGroups(leagueId, season), onSuccess: refresh }),
    moveFixture: useMutation({
      mutationFn: ({ fixtureId, defaultAt }: { fixtureId: string; defaultAt: string }) => leaguesApi.moveLeagueFixture(leagueId, season, fixtureId, defaultAt),
      onSuccess: refresh,
    }),
    announce: useMutation({ mutationFn: (input: { title?: string; message: string }) => leaguesApi.announceToLeague(leagueId, input), onSuccess: refresh }),
    update: useMutation({ mutationFn: (input: UpdateLeagueInput) => leaguesApi.updateLeague(leagueId, input), onSuccess: refresh }),
    nextSeason: useMutation({
      mutationFn: (input: { startsAt: string; endsAt: string; carryOver: boolean }) => leaguesApi.openNextSeason(leagueId, input),
      onSuccess: refresh,
    }),
    uploadImage: useMutation({
      mutationFn: ({ file, kind }: { file: File; kind: "banner" | "logo" }) => leaguesApi.uploadLeagueImage(leagueId, file, kind),
      onSuccess: refresh,
    }),
  };
}

export function useCreateLeagueDraft() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (basics: LeagueBasicsInput) => leaguesApi.createLeagueDraft(basics),
    onSuccess: () => void client.invalidateQueries({ queryKey: leagueKeys.all }),
  });
}

export function useSaveLeagueDraft(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveLeagueDraftInput) => leaguesApi.saveLeagueDraft(id!, input),
    // The response shows the season being set up, which may not be the league's current one.
    onSuccess: () => void client.invalidateQueries({ predicate: (query) => query.queryKey[0] === "leagues" && query.queryKey.includes(id) }),
  });
}

export function usePublishLeague(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => leaguesApi.publishLeague(id!),
    onSuccess: () => void client.invalidateQueries({ queryKey: leagueKeys.all }),
  });
}

/** Live updates for a league page: results, schedule changes and entries arrive over the socket. */
export function useLeagueRealtime(id?: string) {
  const client = useQueryClient();
  useEffect(() => {
    if (!id) return;
    const socket = connectMessagingSocket();
    const join = () => socket.emit("league.join", { leagueId: id });
    const refresh = (event: { leagueId?: string }) => {
      if (event?.leagueId !== id) return;
      void client.invalidateQueries({ predicate: (query) => query.queryKey[0] === "leagues" && query.queryKey.includes(id) });
    };
    join();
    socket.on("connect", join);
    socket.on("league.updated", refresh);
    return () => {
      socket.emit("league.leave", { leagueId: id });
      socket.off("connect", join);
      socket.off("league.updated", refresh);
    };
  }, [client, id]);
}
