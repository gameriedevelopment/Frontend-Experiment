import {
  BroadcastIcon,
  DiscordLogoIcon,
  FacebookLogoIcon,
  GithubLogoIcon,
  GlobeIcon,
  InstagramLogoIcon,
  LinkedinLogoIcon,
  RedditLogoIcon,
  SnapchatLogoIcon,
  SteamLogoIcon,
  TelegramLogoIcon,
  ThreadsLogoIcon,
  TiktokLogoIcon,
  TwitchLogoIcon,
  WhatsappLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import type { PlayerProfile } from "../types";

interface SocialBrand {
  label: string;
  icon: PhosphorIcon;
  /** Brand colour for the logo; the tile itself stays on the dark surface. */
  tone: string;
}

const BRANDS: Record<string, SocialBrand> = {
  twitch: { label: "Twitch", icon: TwitchLogoIcon, tone: "text-[#9146FF]" },
  youtube: { label: "YouTube", icon: YoutubeLogoIcon, tone: "text-[#FF0033]" },
  x: { label: "X", icon: XLogoIcon, tone: "text-white" },
  twitter: { label: "X", icon: XLogoIcon, tone: "text-white" },
  instagram: { label: "Instagram", icon: InstagramLogoIcon, tone: "text-[#E1306C]" },
  tiktok: { label: "TikTok", icon: TiktokLogoIcon, tone: "text-[#25F4EE]" },
  discord: { label: "Discord", icon: DiscordLogoIcon, tone: "text-[#5865F2]" },
  kick: { label: "Kick", icon: BroadcastIcon, tone: "text-[#53FC18]" },
  facebook: { label: "Facebook", icon: FacebookLogoIcon, tone: "text-[#1877F2]" },
  reddit: { label: "Reddit", icon: RedditLogoIcon, tone: "text-[#FF4500]" },
  steam: { label: "Steam", icon: SteamLogoIcon, tone: "text-[#C7D5E0]" },
  linkedin: { label: "LinkedIn", icon: LinkedinLogoIcon, tone: "text-[#0A66C2]" },
  snapchat: { label: "Snapchat", icon: SnapchatLogoIcon, tone: "text-[#FFFC00]" },
  threads: { label: "Threads", icon: ThreadsLogoIcon, tone: "text-white" },
  telegram: { label: "Telegram", icon: TelegramLogoIcon, tone: "text-[#26A5E4]" },
  whatsapp: { label: "WhatsApp", icon: WhatsappLogoIcon, tone: "text-[#25D366]" },
  github: { label: "GitHub", icon: GithubLogoIcon, tone: "text-white" },
};

/** Platforms offered in the profile editor, most used first. */
export const SOCIAL_PLATFORMS = ["Twitch", "YouTube", "X", "Instagram", "TikTok", "Discord", "Kick", "Facebook", "Reddit", "Steam", "Threads", "Snapchat", "LinkedIn", "Telegram", "Website"];

const brandFor = (platform?: string): SocialBrand =>
  BRANDS[(platform ?? "").trim().toLowerCase().replace(/[^a-z]/g, "")] ?? { label: platform?.trim() || "Website", icon: GlobeIcon, tone: "text-mist-200" };

function hrefFor(url?: string) {
  if (!url) return null;
  const value = url.trim();
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

const handleFor = (username?: string, url?: string) => {
  const name = username?.trim();
  if (name) return name.startsWith("@") || name.includes("/") ? name : `@${name}`;
  try {
    return url ? new URL(hrefFor(url)!).hostname.replace(/^www\./, "") : "";
  } catch {
    return url ?? "";
  }
};

/** Only the platforms a player added, each with its real logo. */
export function SocialLinks({ socials, className }: { socials: PlayerProfile["socialMedia"]; className?: string }) {
  const items = (socials ?? []).filter((item) => hrefFor(item.url));
  if (!items.length) return null;
  return (
    <ul className={cn("grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {items.map((item, index) => {
        const brand = brandFor(item.platform);
        const Logo = brand.icon;
        return (
          <li key={item.id ?? `${item.platform}-${index}`}>
            <a
              href={hrefFor(item.url)!}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-center gap-3 rounded-2xl bg-white/3 px-3.5 py-3 ring-1 ring-inset ring-white/6 transition-colors hover:bg-white/6 hover:ring-white/15"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-950 ring-1 ring-inset ring-white/8">
                <Logo weight="fill" className={cn("size-5", brand.tone)} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{brand.label}</span>
                <span className="block truncate text-xs text-mist-400">{handleFor(item.username, item.url)}</span>
              </span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
