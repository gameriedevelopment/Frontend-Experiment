import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { useAuthStore } from "@/features/auth/authStore";
import { usePlayerProfile } from "@/features/profile/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { AccountSettings } from "./components/AccountSettings";
import { NotificationSettings } from "./components/NotificationSettings";
import { PrivacySettings } from "./components/PrivacySettings";
import { ProfileSettings } from "./components/ProfileSettings";
import { withDefaults } from "./defaults";
import { usePlayerSettings } from "./hooks";
import type { SettingsSection } from "./types";

const sections: Array<{ id: SettingsSection; label: string; description: string; icon: IconName }> = [
  { id: "profile", label: "Profile", description: "Photos, identity, details and links", icon: "user" },
  { id: "privacy", label: "Privacy", description: "Who sees your profile and details", icon: "eye" },
  { id: "notifications", label: "Notifications", description: "What reaches you, and when", icon: "bell" },
  { id: "account", label: "Account", description: "Email, password, phone and sign-in", icon: "lock" },
];

function Loading() {
  return (
    <div aria-hidden="true" className="grid gap-6">
      <Skeleton className="h-40 rounded-card" />
      <Skeleton className="h-72 rounded-card" />
    </div>
  );
}

function Failed({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <StatePanel
      icon="warning"
      tone="danger"
      title="Settings didn't load"
      description={getApiErrorMessage(error, "Try again in a moment.")}
      action={
        <Button tone="outline" size="sm" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}

function Section({ section, userId, username }: { section: SettingsSection; userId: string; username: string }) {
  const needsSettings = section === "privacy" || section === "notifications";
  const profile = usePlayerProfile(needsSettings ? undefined : username);
  const settings = usePlayerSettings(needsSettings ? userId : undefined);

  if (needsSettings) {
    if (settings.isLoading) return <Loading />;
    if (settings.isError) return <Failed error={settings.error} onRetry={() => void settings.refetch()} />;
    const value = withDefaults(settings.data);
    // Keyed on the saved values so the form resets when they change underneath it.
    return section === "privacy" ? (
      <PrivacySettings key={JSON.stringify(value.privacy)} privacy={value.privacy} userId={userId} />
    ) : (
      <NotificationSettings key={JSON.stringify([value.notificationPreferences, value.timezone])} preferences={value.notificationPreferences} timezone={value.timezone!} userId={userId} />
    );
  }
  if (profile.isLoading) return <Loading />;
  if (profile.isError || !profile.data) return <Failed error={profile.error} onRetry={() => void profile.refetch()} />;
  return section === "profile" ? <ProfileSettings profile={profile.data} /> : <AccountSettings profile={profile.data} />;
}

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const requested = params.get("section") as SettingsSection | null;
  const chosen = sections.some((item) => item.id === requested) ? requested : null;
  // Phones show the list until a section is picked; wider screens always show one.
  const section: SettingsSection = chosen ?? "profile";
  const current = sections.find((item) => item.id === section)!;

  const navigate = useNavigate();
  const location = useLocation();
  // Opening a section from the list adds a history entry, so the phone's back gesture returns to the
  // list; moving between sections replaces it.
  const open = (next: SettingsSection | null) => {
    if (!next && (location.state as { fromList?: boolean } | null)?.fromList) navigate(-1);
    else setParams(next ? { section: next } : {}, { replace: Boolean(chosen) || !next, state: chosen ? location.state : { fromList: true } });
    window.scrollTo({ top: 0 });
  };

  if (!user) return null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader title="Settings" description="Your profile, privacy, notifications and account." />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
        <nav aria-label="Settings sections" className={cn("lg:sticky lg:top-24", chosen && "hidden lg:block")}>
          <ul className="grid gap-1">
            {sections.map((item) => {
              const active = item.id === section;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => open(item.id)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                      active ? "lg:bg-white/6 lg:ring-1 lg:ring-inset lg:ring-white/8" : "hover:bg-white/4",
                    )}
                  >
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-mist-300 transition-colors", active && "lg:bg-lavender-400/14 lg:text-lavender-300")}>
                      <Icon name={item.icon} className="size-[1.1rem]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm font-medium", active ? "lg:text-mist-50" : "text-mist-100")}>{item.label}</span>
                      <span className="block truncate text-xs text-mist-500">{item.description}</span>
                    </span>
                    <Icon name="arrowRight" className="size-3.5 shrink-0 text-mist-500 lg:hidden" />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5", !chosen && "hidden lg:grid")}>
          <div className="flex items-center gap-3 lg:hidden">
            <button type="button" onClick={() => open(null)} aria-label="All settings" className="grid size-10 place-items-center rounded-full text-mist-300 ring-1 ring-inset ring-white/10 hover:bg-white/6 hover:text-mist-50">
              <Icon name="arrowLeft" className="size-4" />
            </button>
            <h2 className="text-lg font-semibold">{current.label}</h2>
          </div>
          <Section key={section} section={section} userId={user.id} username={user.username ?? user.id} />
        </div>
      </div>
    </div>
  );
}
