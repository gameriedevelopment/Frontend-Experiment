import { api, unwrap, type AdminPage } from "@/lib/api";
import type { TeamDossier, TeamQuery, TeamRow } from "./types";

export const listTeams = (query: TeamQuery) => unwrap<AdminPage<TeamRow>>(api.get("/admin/teams", { params: query }));

export const getTeamDossier = (id: string) => unwrap<TeamDossier>(api.get(`/admin/teams/${id}/overview`));
