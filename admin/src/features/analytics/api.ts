import { api, unwrap } from "@/lib/api";
import type { AnalyticsRange, PostAnalytics, RetentionAnalytics } from "./types";

export const analyticsKey = ["admin", "analytics"] as const;
export const getPostAnalytics = (filter: AnalyticsRange) =>
  unwrap<PostAnalytics>(api.get("/admin/post-analytics", { params: { filter } }));

export const getRetentionAnalytics = (filter: AnalyticsRange) =>
  unwrap<RetentionAnalytics>(api.get("/admin/retention-analytics", { params: { filter } }));
