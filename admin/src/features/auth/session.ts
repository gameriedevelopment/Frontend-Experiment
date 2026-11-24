import axios from "axios";
import { create } from "zustand";
import { onSessionExpired } from "@/lib/api";
import { clearCredential, fetchSession, hasCredential, NotAnAdminError } from "./api";
import type { AdminUser } from "./types";

/** `offline` keeps the stored sign-in: the server didn't answer, so nothing is known to be wrong with it. */
type Status = "checking" | "signed-in" | "signed-out" | "offline";

interface SessionState {
  status: Status;
  user: AdminUser | null;
  /** Why the operator was signed out, shown on the sign-in screen. */
  notice: "expired" | "revoked" | null;
  restore: () => Promise<void>;
  signedIn: (user: AdminUser) => void;
  signOut: (notice?: SessionState["notice"]) => void;
}

export const useSession = create<SessionState>((set) => ({
  status: hasCredential() ? "checking" : "signed-out",
  user: null,
  notice: null,
  restore: async () => {
    if (!hasCredential()) return set({ status: "signed-out", user: null });
    set({ status: "checking" });
    try {
      set({ status: "signed-in", user: await fetchSession(), notice: null });
    } catch (error) {
      if (error instanceof NotAnAdminError) {
        clearCredential();
        return set({ status: "signed-out", user: null, notice: "revoked" });
      }
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        clearCredential();
        return set({ status: "signed-out", user: null, notice: "expired" });
      }
      set({ status: "offline", user: null });
    }
  },
  signedIn: (user) => set({ status: "signed-in", user, notice: null }),
  signOut: (notice = null) => {
    clearCredential();
    set({ status: "signed-out", user: null, notice });
  },
}));

onSessionExpired(() => {
  if (useSession.getState().status === "signed-in") useSession.getState().signOut("expired");
});
