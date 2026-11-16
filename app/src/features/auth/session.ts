import Cookies from "js-cookie";
import { useAuthStore } from "./authStore";

export const SESSION_ENDED_EVENT = "gamerie:session-ended";

export type SessionEndReason = "expired" | "unauthorized" | "logout";

export function endClientSession(reason: SessionEndReason): void {
  const hadSession = Boolean(Cookies.get("auth_token") || useAuthStore.getState().user);

  Cookies.remove("auth_token");
  useAuthStore.getState().clearUser();

  if (typeof sessionStorage !== "undefined") {
    if (reason === "logout") {
      sessionStorage.removeItem("Gamerie_session_notice");
    } else if (hadSession) {
      sessionStorage.setItem(
        "Gamerie_session_notice",
        "Your session expired. Sign in again to continue.",
      );
    }
  }

  if (hadSession && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_ENDED_EVENT, { detail: { reason } }));
  }
}
