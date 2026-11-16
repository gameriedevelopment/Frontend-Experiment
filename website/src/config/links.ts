import type { IconName } from "@/components/ui/Icon";

function publicUrl(value: string | undefined) {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol === "https:" || (isLocal && url.protocol === "http:")) {
      return url.href;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

const env = import.meta.env;
const app = publicUrl(env.VITE_APP_URL) ?? "https://app.gamerie.gg";

export const links = {
  register: new URL("/register", app).href,
  signIn: new URL("/signin", app).href,
  discord: publicUrl(env.VITE_DISCORD_INVITE_LINK) ?? "https://discord.gg/tKmCVrMw",
  partners: publicUrl(env.VITE_PARTNERS_PAGE) ?? "https://partners.gamerie.gg",
  terms: "https://gameriedevelopment.github.io/Terms-of-service/",
  privacy: "https://gameriedevelopment.github.io/Privacy-policy/",
  cookies: "https://gameriedevelopment.github.io/Cookie-policy/",
  guidelines: "https://gameriedevelopment.github.io/Community-guidelines/",
  minors: "https://gameriedevelopment.github.io/Minors-policy/",
};

export const socialLinks = (
  [
    { label: "Discord", icon: "discord", href: links.discord },
    { label: "X", icon: "x", href: publicUrl(env.VITE_X_URL) },
    { label: "Instagram", icon: "instagram", href: publicUrl(env.VITE_INSTAGRAM_URL) },
    { label: "TikTok", icon: "tiktok", href: publicUrl(env.VITE_TIKTOK_URL) },
    { label: "YouTube", icon: "youtube", href: publicUrl(env.VITE_YOUTUBE_URL) },
    { label: "LinkedIn", icon: "linkedin", href: publicUrl(env.VITE_LINKEDIN_URL) },
  ] satisfies ReadonlyArray<{ label: string; icon: IconName; href: string | undefined }>
).filter((link): link is typeof link & { href: string } => Boolean(link.href));
