import { api, unwrap, type AdminPage } from "@/lib/api";
import type { GameInput, GameQuery, GameRow, GameSummary } from "./types";

export const listGames = (query: GameQuery) => unwrap<AdminPage<GameRow>>(api.get("/admin/games", { params: query }));
export const getGame = (id: string) => unwrap<GameRow>(api.get(`/admin/games/${id}`));
export const getGameSummary = () => unwrap<GameSummary>(api.get("/admin/games/summary"));

const LIST_FIELDS = new Set<keyof GameInput>(["platforms", "gameModes", "requiredSkills"]);

/** Multipart, because the cover travels with the fields. Lists go as JSON, the way the API reads them. */
function toForm(fields: Partial<GameInput>, cover: File | null) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields) as Array<[keyof GameInput, GameInput[keyof GameInput]]>) {
    form.append(key, LIST_FIELDS.has(key) ? JSON.stringify(value) : String(value).trim());
  }
  if (cover) form.append("file", cover);
  return form;
}

export function createGame(input: GameInput, cover: File | null) {
  const { integrationKey, matchVerificationAdapter, ...rest } = input;
  const fields: Partial<GameInput> = { ...rest };
  if (integrationKey.trim()) fields.integrationKey = integrationKey;
  if (matchVerificationAdapter) fields.matchVerificationAdapter = matchVerificationAdapter;
  return unwrap<GameRow>(api.post("/admin/games", toForm(fields, cover)));
}

/** Sends only what changed, so the audit log names the fields that actually moved. */
export const updateGame = (id: string, changes: Partial<GameInput>, cover: File | null) =>
  unwrap<GameRow>(api.patch(`/admin/games/${id}`, toForm(changes, cover)));

export const deleteGame = (id: string, reason: string) => api.delete(`/admin/games/${id}`, { data: { reason } });
