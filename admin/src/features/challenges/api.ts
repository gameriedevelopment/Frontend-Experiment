import { api, unwrap, type AdminPage } from "@/lib/api";
import type {
  Challenge,
  ChallengeQuery,
  ChallengeSummary,
  CreateChallengeInput,
  EligibleMember,
  OrganiserResult,
  OrganiserResultInput,
  UpdateChallengeInput,
} from "./types";

export const listChallenges = (query: ChallengeQuery) => unwrap<AdminPage<Challenge>>(api.get("/admin/challenges", { params: query }));
export const getChallenge = (id: string) => unwrap<Challenge>(api.get(`/admin/challenges/${id}`));
export const getChallengeSummary = () => unwrap<ChallengeSummary>(api.get("/admin/challenges/summary"));
export const getEligibleLineup = (teamId: string) => unwrap<EligibleMember[]>(api.get(`/admin/challenges/teams/${teamId}/eligible-lineup`));

export const createChallenge = (input: CreateChallengeInput) => unwrap<Challenge>(api.post("/admin/challenges", input));
export const updateChallenge = (id: string, input: UpdateChallengeInput) => unwrap<Challenge>(api.patch(`/admin/challenges/${id}`, input));
export const deleteChallenge = (id: string, reason: string) => api.delete(`/admin/challenges/${id}`, { data: { reason } });

export const listOrganiserResults = (query: { page: number; limit: number; search?: string }) =>
  unwrap<AdminPage<OrganiserResult>>(api.get("/admin/organiser-results", { params: query }));
export const createOrganiserResult = (input: OrganiserResultInput) => unwrap<{ id: string }>(api.post("/admin/organiser-results", input));
