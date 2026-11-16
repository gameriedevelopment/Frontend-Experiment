import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { beginSocialAuth, type SocialProvider } from "../api";

const providers: Array<{ id: SocialProvider; label: string; logo: string; available: boolean }> = [
  { id: "google", label: "Google", logo: "/social/google.png", available: true },
  { id: "discord", label: "Discord", logo: "/social/discord.png", available: true },
  { id: "facebook", label: "Facebook", logo: "/social/facebook.png", available: true },
  { id: "apple", label: "Apple", logo: "/social/apple.png", available: false },
];

export function SocialAuthOptions({
  mode,
  referralCode,
}: {
  mode: "signin" | "signup";
  referralCode?: string;
}) {
  const [activeProvider, setActiveProvider] = useState<SocialProvider | null>(null);
  const verb = mode === "signin" ? "Sign in" : "Sign up";

  const continueWith = (provider: SocialProvider) => {
    setActiveProvider(provider);
    beginSocialAuth(provider, mode === "signup" ? referralCode : undefined);
  };

  return (
    <section aria-label={`${verb} with a connected account`} className="grid gap-5">
      <div className="type-label flex items-center gap-4 text-mist-500">
        <span className="h-px flex-1 bg-white/8" />
        or continue with
        <span className="h-px flex-1 bg-white/8" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => continueWith(provider.id)}
            disabled={!provider.available || activeProvider !== null}
            aria-label={`${verb} with ${provider.label}${provider.available ? "" : ", unavailable"}`}
            title={provider.available ? undefined : "Apple sign in is not available yet"}
            className={cn(
              "flex h-11 items-center justify-center gap-2.5 rounded-2xl bg-white/[0.04] text-sm font-medium text-mist-50 ring-1 ring-inset ring-white/10 transition-[background-color,box-shadow] duration-200 hover:bg-white/[0.08] hover:ring-white/20 disabled:cursor-not-allowed",
              !provider.available && "opacity-45",
            )}
          >
            {activeProvider === provider.id ? (
              <Icon name="spinner" className="size-[1.1rem] animate-spin" />
            ) : (
              <img src={provider.logo} alt="" className="size-[1.15rem] object-contain" />
            )}
            {provider.label}
            {!provider.available && <span className="type-label text-[0.6rem] text-mist-500">Soon</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
