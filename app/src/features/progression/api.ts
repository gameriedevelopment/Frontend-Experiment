import { api, type ApiEnvelope } from "@/lib/api";
import type { ProgressionGuide } from "./types";

export async function getProgressionGuide(): Promise<ProgressionGuide> {
  const response = await api.get<ApiEnvelope<ProgressionGuide>>("/progression/guide");
  return response.data.data;
}
