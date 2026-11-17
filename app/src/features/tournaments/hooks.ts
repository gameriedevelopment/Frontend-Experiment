import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { connectMessagingSocket } from "@/features/messages/api";
import * as tournamentsApi from "./api";
import type { TournamentFilters, TournamentPhase } from "./types";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  directory: (filters: TournamentFilters) => ["tournaments", "directory", filters] as const,
  hosted: (id: string) => ["tournaments", "hosted", id] as const,
  bracket: (id: string) => ["tournaments", "hosted", id, "bracket"] as const,
  participants: (id: string) => ["tournaments", "hosted", id, "participants"] as const,
  manage: (id: string) => ["tournaments", "hosted", id, "manage"] as const,
  activity: (id: string, page: number) => ["tournaments", "hosted", id, "activity", page] as const,
  mine: (role: string) => ["tournaments", "mine", role] as const,
};

// The socket pushes changes as they happen; tournaments in play also refresh on a timer in case it drops.
const livePhases: TournamentPhase[] = ["check_in", "awaiting_start", "live"];

/** Upcoming tournaments hosted on Gamerie, for surfaces that show a short list. `game` is a game name. */
export function useOpenTournaments(limit = 3, game?: string, enabled = true) {
  return useQuery({
    queryKey: ["tournaments", "open", limit, game ?? null],
    queryFn: () => tournamentsApi.getTournaments({ status: "upcoming", source: "gamerie", game }, 1, limit),
    enabled,
    staleTime: 2 * 60_000,
  });
}

export function useTournaments(filters: TournamentFilters) {
  return useInfiniteQuery({
    queryKey: tournamentKeys.directory(filters),
    queryFn: ({ pageParam }) => tournamentsApi.getTournaments(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.hasMore ? page.page + 1 : undefined),
    staleTime: 60_000,
  });
}

/** Platforms, regions, skill levels and team sizes that open tournaments actually use, for the directory filters. */
export function useTournamentFacets() {
  return useQuery({
    queryKey: ["tournaments", "facets"],
    queryFn: tournamentsApi.getTournamentFacets,
    staleTime: 10 * 60_000,
  });
}

export function useMyTournaments(role: "all" | "hosting" | "entered", enabled = true) {
  return useInfiniteQuery({
    queryKey: tournamentKeys.mine(role),
    queryFn: ({ pageParam }) => tournamentsApi.getMyTournaments(role, pageParam),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.hasMore ? page.page + 1 : undefined),
    enabled,
  });
}

export function useTournamentLeaderboard(kind: "player" | "team", game?: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["tournaments", "leaderboard", kind, game ?? "all"],
    queryFn: ({ pageParam }) => tournamentsApi.getTournamentLeaderboard({ kind, game, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.page * page.limit < page.total ? page.page + 1 : undefined),
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function useHostingOptions(enabled = true) {
  return useQuery({
    queryKey: ["tournaments", "hosting-options"],
    queryFn: tournamentsApi.getHostingOptions,
    staleTime: 60_000,
    enabled,
  });
}

export function useHostedTournament(id?: string) {
  return useQuery({
    queryKey: tournamentKeys.hosted(id ?? ""),
    queryFn: () => tournamentsApi.getHostedTournament(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
    refetchInterval: (query) => (query.state.data && livePhases.includes(query.state.data.phase) ? 20_000 : false),
  });
}

/** Refreshes the tournament, its bracket and entrants whenever the host or a result changes it. */
export function useTournamentRealtime(id?: string) {
  const client = useQueryClient();
  useEffect(() => {
    if (!id) return;
    const socket = connectMessagingSocket();
    const join = () => socket.emit("tournament.join", { tournamentId: id });
    const refresh = (event: { tournamentId?: string }) => {
      if (event?.tournamentId === id) void client.invalidateQueries({ queryKey: tournamentKeys.hosted(id) });
    };
    join();
    socket.on("connect", join);
    socket.on("tournament.updated", refresh);
    return () => {
      socket.emit("tournament.leave", { tournamentId: id });
      socket.off("connect", join);
      socket.off("tournament.updated", refresh);
    };
  }, [client, id]);
}

export function useTournamentBracket(id: string, enabled = true, live = false) {
  return useQuery({
    queryKey: tournamentKeys.bracket(id),
    queryFn: () => tournamentsApi.getTournamentBracket(id),
    enabled,
    staleTime: 10_000,
    refetchInterval: live ? 20_000 : false,
  });
}

export function useTournamentParticipants(id: string, enabled = true) {
  return useQuery({
    queryKey: tournamentKeys.participants(id),
    queryFn: () => tournamentsApi.getTournamentParticipants(id),
    enabled,
    staleTime: 15_000,
  });
}

export function useManageOverview(id: string, enabled: boolean) {
  return useQuery({
    queryKey: tournamentKeys.manage(id),
    queryFn: () => tournamentsApi.getManageOverview(id),
    enabled,
    staleTime: 10_000,
  });
}

export function useActivityLog(id: string, page: number, enabled: boolean) {
  return useQuery({
    queryKey: tournamentKeys.activity(id, page),
    queryFn: () => tournamentsApi.getActivityLog(id, page),
    enabled,
  });
}

/** A clock that ticks every 30 seconds, for labels that change with time. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function invalidateTournament(client: QueryClient, id: string) {
  void client.invalidateQueries({ queryKey: tournamentKeys.hosted(id) });
  void client.invalidateQueries({ queryKey: ["tournaments", "mine"] });
  void client.invalidateQueries({ queryKey: ["tournaments", "directory"] });
  void client.invalidateQueries({ queryKey: ["tournaments", "open"] });
  void client.invalidateQueries({ queryKey: ["challenges"] });
  void client.invalidateQueries({ queryKey: ["calendar-events"] });
}

/** Wraps a tournament action so every success refreshes that tournament everywhere. */
export function useTournamentAction<TArgs, TResult = unknown>(id: string, action: (args: TArgs) => Promise<TResult>) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => invalidateTournament(client, id),
  });
}
