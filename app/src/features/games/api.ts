import { api, type ApiEnvelope } from "@/lib/api";
import type { GameConnection, GamesPage } from "./types";

export async function getGameConnections(): Promise<GameConnection[]> {
  const { data } = await api.get<ApiEnvelope<GameConnection[]>>("/game-connections");
  return data.data ?? [];
}

export async function searchGameOptions(search: string, page = 1): Promise<GamesPage> {
  const { data } = await api.get<ApiEnvelope<GamesPage>>("/games", {
    params: { search: search || undefined, page, limit: 20 },
  });
  return data.data;
}
