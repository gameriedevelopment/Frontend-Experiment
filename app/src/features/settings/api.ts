import { api, type ApiEnvelope } from "@/lib/api";
import type { PlayerSettings, SettingsPatch } from "./types";

export async function getPlayerSettings(userId: string): Promise<PlayerSettings> {
  const { data } = await api.get<ApiEnvelope<PlayerSettings>>(`/users/settings/${userId}`);
  return data.data;
}

/** The API merges what it's sent, so each section saves only its own slice. */
export async function updatePlayerSettings(userId: string, patch: SettingsPatch): Promise<PlayerSettings> {
  const { data } = await api.patch<ApiEnvelope<PlayerSettings>>(`/users/settings/${userId}`, patch);
  return data.data;
}
