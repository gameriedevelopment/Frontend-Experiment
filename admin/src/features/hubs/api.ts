import { api, unwrap, type AdminPage } from "@/lib/api";
import type { HubDossier, HubQuery, HubRow } from "./types";

export const listHubs = (query: HubQuery) => unwrap<AdminPage<HubRow>>(api.get("/admin/hubs", { params: query }));

export const getHubDossier = (id: string) => unwrap<HubDossier>(api.get(`/admin/hubs/${id}/overview`));
