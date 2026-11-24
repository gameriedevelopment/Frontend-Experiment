export type AdminEnvironment = "production" | "staging" | "local";

/** Which backend this console talks to. Set VITE_ADMIN_ENV on each deploy; local dev defaults to local. */
export const ENVIRONMENT: AdminEnvironment =
  (import.meta.env.VITE_ADMIN_ENV as AdminEnvironment | undefined) ?? (import.meta.env.DEV ? "local" : "production");

export const PLAYER_APP_URL = (import.meta.env.VITE_PLAYER_APP_URL || "https://frontend-experiment-blush.vercel.app").replace(/\/$/, "");

/** A link into the player app, for "Open in Gamerie". */
export const playerAppLink = (path: string) => `${PLAYER_APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
