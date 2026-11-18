import { api, type ApiEnvelope } from "@/lib/api";
import type { ProgressionGuide, ProgressionHistory } from "./types";

export async function getProgressionGuide(): Promise<ProgressionGuide> {
  const response = await api.get<ApiEnvelope<ProgressionGuide>>("/progression/guide");
  return response.data.data;
}

export async function getProgressionHistory(page = 1): Promise<ProgressionHistory> {
  const response = await api.get<ApiEnvelope<ProgressionHistory>>("/progression/me/history", { params: { page } });
  return response.data.data;
}
