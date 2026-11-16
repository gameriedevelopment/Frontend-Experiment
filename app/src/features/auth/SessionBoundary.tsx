import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useAuthStore } from "./authStore";
import { endClientSession, SESSION_ENDED_EVENT } from "./session";

export function SessionBoundary() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const clearPrivateCache = () => queryClient.clear();
    const verifyStoredSession = () => {
      if (useAuthStore.getState().user && !Cookies.get("auth_token")) {
        endClientSession("expired");
      }
    };
    const verifyVisibleSession = () => {
      if (document.visibilityState === "visible") verifyStoredSession();
    };

    window.addEventListener(SESSION_ENDED_EVENT, clearPrivateCache);
    window.addEventListener("focus", verifyStoredSession);
    document.addEventListener("visibilitychange", verifyVisibleSession);
    verifyStoredSession();

    return () => {
      window.removeEventListener(SESSION_ENDED_EVENT, clearPrivateCache);
      window.removeEventListener("focus", verifyStoredSession);
      document.removeEventListener("visibilitychange", verifyVisibleSession);
    };
  }, [queryClient]);

  return null;
}
