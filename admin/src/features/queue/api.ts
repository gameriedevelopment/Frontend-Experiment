import { api, unwrap } from "@/lib/api";
import type { QueueSummary } from "./types";

export const getQueue = () => unwrap<QueueSummary>(api.get("/admin/queue"));
