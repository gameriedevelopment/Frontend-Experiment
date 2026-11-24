import { api, unwrap, type AdminPage } from "@/lib/api";
import type { UserDossier, UserQuery, UserRow } from "./types";

export const listUsers = (query: UserQuery) => unwrap<AdminPage<UserRow>>(api.get("/admin/users", { params: query }));

export const getUserDossier = (id: string) => unwrap<UserDossier>(api.get(`/admin/users/${id}/overview`));
