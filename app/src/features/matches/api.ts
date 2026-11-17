import { api, type ApiEnvelope } from "@/lib/api";
import type { ConfirmedMatch, MatchReviewInput, MatchSubmission, PlayerCardSharePrompt } from "./types";

export async function uploadMatchEvidence(gameId: string, evidence: File, idempotencyKey: string, onProgress?: (percentage: number) => void) {
  const form = new FormData();
  form.append("gameId", gameId);
  form.append("evidence", evidence);
  const { data } = await api.post<ApiEnvelope<MatchSubmission>>("/match-verification/submissions", form, {
    headers: { "Content-Type": "multipart/form-data", "Idempotency-Key": idempotencyKey },
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
    },
  });
  return data.data;
}

export async function processMatchSubmission(id: string) {
  const { data } = await api.post<ApiEnvelope<MatchSubmission>>(`/match-verification/submissions/${id}/process`);
  return data.data;
}

export async function getMatchSubmission(id: string) {
  const { data } = await api.get<ApiEnvelope<MatchSubmission>>(`/match-verification/submissions/${id}`);
  return data.data;
}

export async function getMatchEvidence(id: string) {
  const { data } = await api.get<Blob>(`/match-verification/submissions/${id}/evidence`, { responseType: "blob" });
  return data;
}

export async function reviewMatchSubmission(id: string, input: MatchReviewInput) {
  const { data } = await api.patch<ApiEnvelope<MatchSubmission>>(`/match-verification/submissions/${id}/review`, input);
  return data.data;
}

export async function confirmMatchSubmission(id: string) {
  const { data } = await api.post<ApiEnvelope<ConfirmedMatch>>(`/match-verification/submissions/${id}/confirm`);
  return data.data;
}

export async function recordPlayerCardShare(matchId: string, reason: PlayerCardSharePrompt["reason"], channel: "native_share" | "link_copy") {
  await api.post("/retention/player-card-shares", { matchId, reason, channel });
}
