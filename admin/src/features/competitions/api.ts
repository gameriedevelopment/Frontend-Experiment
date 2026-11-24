import { api, unwrap } from "@/lib/api";
import type { CompetitionSummary } from "./types";

export const getCompetitionSummary = () => unwrap<CompetitionSummary>(api.get("/admin/competitions/summary"));
