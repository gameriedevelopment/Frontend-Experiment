import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { EditProfileDialog, type EditSection } from "@/features/profile/components/EditProfileDialog";
import type { PlayerProfile } from "@/features/profile/types";
import { TournamentArt } from "@/features/tournaments/components/TournamentArt";
import { SettingsCard } from "./SettingsParts";

const platformLabels: Record<string, string> = { XBOX: "Xbox" };
const list = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" · ");
const count = (value: number, word: string) => `${value} ${word}${value === 1 ? "" : "s"}`;

function rows(profile: PlayerProfile): Array<{ id: EditSection; icon: IconName; label: string; summary: string }> {
  const personal = profile.personalInfo ?? {};
  const skills = profile.skills?.length ?? 0;
  const links = profile.socialMedia?.filter((item) => item.url || item.username).length ?? 0;
  return [
    {
      id: "photos",
      icon: "camera",
      label: "Photos",
      summary: list(profile.profileImage ? "Profile photo" : "No profile photo", profile.backgroundImage ? "cover" : "no cover"),
    },
    { id: "identity", icon: "identity", label: "Identity", summary: list(profile.username, profile.gamerTitle, profile.gameLevel, profile.region) },
    { id: "personal", icon: "user", label: "Personal details", summary: list(personal.fullName, personal.location, personal.profession) || "Nothing added yet" },
    {
      id: "skills",
      icon: "spark",
      label: "Skills and platforms",
      summary: list(profile.platforms?.map((platform) => platformLabels[platform] ?? platform).join(", "), skills > 0 && count(skills, "skill")) || "Nothing added yet",
    },
    { id: "links", icon: "link", label: "Links", summary: links ? count(links, "link") : "No links yet" },
  ];
}

export function ProfileSettings({ profile }: { profile: PlayerProfile }) {
  const [editing, setEditing] = useState<EditSection | null>(null);
  const href = `/profile/${encodeURIComponent(profile.username)}`;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section className="overflow-hidden rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
        <TournamentArt src={profile.backgroundImage} game={profile.username} className="h-24" />
        <div className="px-5 pb-5 sm:px-6">
          <Avatar src={profile.profileImage} name={profile.username} size="lg" className="-mt-7 ring-4 ring-ink-900" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{profile.username}</p>
              <p className="truncate text-sm text-mist-400">{list(profile.gamerTitle, profile.gameLevel) || "Player"}</p>
            </div>
            <LinkButton to={href} tone="outline" size="sm" icon="arrowUpRight">
              View profile
            </LinkButton>
          </div>
        </div>
      </section>

      <SettingsCard title="Your profile" description="What other players see. Who can see it is under Privacy.">
        <ul className="-mx-3 grid grid-cols-[minmax(0,1fr)]">
          {rows(profile).map((row) => (
            <li key={row.id}>
              <button type="button" onClick={() => setEditing(row.id)} className="group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-mist-300 transition-colors group-hover:text-lavender-200">
                  <Icon name={row.icon} className="size-[1.1rem]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-mist-100">{row.label}</span>
                  <span className="block truncate text-sm text-mist-400">{row.summary}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-mist-400 transition-colors group-hover:text-lavender-200">
                  Edit
                  <Icon name="arrowRight" className="size-3.5" />
                </span>
              </button>
            </li>
          ))}
          <li>
            <Link to={`${href}?tab=games`} className="group flex w-full items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-white/4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-mist-300 transition-colors group-hover:text-lavender-200">
                <Icon name="games" className="size-[1.1rem]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-mist-100">Games and linked accounts</span>
                <span className="block truncate text-sm text-mist-400">The games you play and the accounts that verify them</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-mist-400 transition-colors group-hover:text-lavender-200">
                Manage
                <Icon name="arrowRight" className="size-3.5" />
              </span>
            </Link>
          </li>
        </ul>
      </SettingsCard>

      {editing && <EditProfileDialog profile={profile} section={editing} onSection={setEditing} onClose={() => setEditing(null)} />}
    </div>
  );
}
