import Cookies from "js-cookie";
import { ADMIN_TOKEN_COOKIE, api, unwrap } from "@/lib/api";
import { isAdmin, type AcceptInviteInput, type AdminInviteDetails, type AdminUser } from "./types";

export class NotAnAdminError extends Error {
  constructor() {
    super("This account doesn't have admin access.");
  }
}

export async function fetchSession(): Promise<AdminUser> {
  const user = await unwrap(api.get("/admin/session"));
  if (!isAdmin(user as AdminUser)) throw new NotAnAdminError();
  return user as AdminUser;
}

export async function signIn(email: string, password: string): Promise<AdminUser> {
  const { token, user } = await unwrap<{ token: string; user: AdminUser }>(api.post("/admin-auth/login", { email, password }));
  if (!token || !user?.id) throw new Error("Sign-in didn't complete. Try again.");
  Cookies.set(ADMIN_TOKEN_COOKIE, token, { secure: window.location.protocol === "https:", sameSite: "Lax" });
  try {
    return await fetchSession();
  } catch (error) {
    Cookies.remove(ADMIN_TOKEN_COOKIE);
    throw error;
  }
}

export const hasCredential = () => Boolean(Cookies.get(ADMIN_TOKEN_COOKIE));
export const clearCredential = () => Cookies.remove(ADMIN_TOKEN_COOKIE);

export const lookupInvite = (token: string) => unwrap<AdminInviteDetails>(api.get("/admin-invites/lookup", { params: { token } }));

export const acceptInvite = async (input: AcceptInviteInput) => {
  await api.post("/admin-invites/accept", input);
};
