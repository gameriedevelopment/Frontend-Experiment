function httpsUrl(value: string | undefined, fallback: string) {
  try {
    const url = new URL(value?.trim() || fallback);
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol === "https:" || (isLocal && url.protocol === "http:")) {
      return url.href;
    }
  } catch {
    // An invalid public override falls back to the Gamerie destination.
  }
  return fallback;
}

const app = httpsUrl(import.meta.env.VITE_APP_URL, "https://app.gamerie.gg");

export const links = {
  register: new URL("/register", app).href,
  signIn: new URL("/signin", app).href,
  discord: httpsUrl(
    import.meta.env.VITE_DISCORD_INVITE_LINK,
    "https://discord.gg/tKmCVrMw",
  ),
  partners: httpsUrl(
    import.meta.env.VITE_PARTNERS_PAGE,
    "https://partners.gamerie.gg",
  ),
  terms: "https://gameriedevelopment.github.io/Terms-of-service/",
  privacy: "https://gameriedevelopment.github.io/Privacy-policy/",
  cookies: "https://gameriedevelopment.github.io/Cookie-policy/",
  guidelines: "https://gameriedevelopment.github.io/Community-guidelines/",
  minors: "https://gameriedevelopment.github.io/Minors-policy/",
};
