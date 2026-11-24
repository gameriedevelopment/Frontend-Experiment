import { useQuery } from "@tanstack/react-query";
import { getQueue } from "./api";

export const queueKey = ["admin", "queue"] as const;

/** Polled so the sidebar badges and the Overview stay honest while the console is open. */
export const useQueue = () =>
  useQuery({ queryKey: queueKey, queryFn: getQueue, refetchInterval: 60_000, refetchIntervalInBackground: false });
