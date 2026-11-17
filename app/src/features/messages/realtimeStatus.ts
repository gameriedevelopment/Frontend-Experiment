import { useSyncExternalStore } from "react";

let connected = false;
const listeners = new Set<() => void>();

export function setRealtimeConnected(next: boolean) {
  if (connected === next) return;
  connected = next;
  listeners.forEach((listener) => listener());
}

export function useRealtimeConnected() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => connected,
  );
}

/** Counts are pushed while the socket is up, so polling drops to a slow safety net; offline it speeds back up. */
export const fallbackInterval = (live: boolean) => (live ? 120_000 : 30_000);
