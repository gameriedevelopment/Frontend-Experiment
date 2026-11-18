import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useAuthStore } from "@/features/auth/authStore";
import { getApiErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/cn";
import { useToggleSkillEndorsement } from "../hooks";
import type { PlayerProfile, ProfileSkill } from "../types";
import { EmptyLine, ProfileSection } from "./ProfileSection";
import { SocialLinks } from "./SocialLinks";
import { NeedsPanel, ReferralPanel } from "./OpportunityPanels";

const endorsementCount = (skill: ProfileSkill) =>
  Number(skill.endorsementCount ?? (typeof skill.endorsements === "number" ? skill.endorsements : 0));

function SkillsPanel({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const viewer = useAuthStore((state) => state.user);
  const mutation = useToggleSkillEndorsement(viewer?.id, profile.id);
  const [showAll, setShowAll] = useState(false);
  const skills = profile.skills ?? [];
  const visible = showAll ? skills : skills.slice(0, 5);

  return (
    <ProfileSection title="Skills" meta={skills.length > 5 ? `${skills.length} skills` : undefined}>
      {skills.length ? (
        <ul className="divide-y divide-white/6">
          {visible.map((skill, index) => {
            const count = endorsementCount(skill);
            return (
              <li key={skill.id || index} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                <Icon
                  name={count > 0 ? "verified" : "user"}
                  weight="duotone"
                  className={cn("size-5", count > 0 ? "text-lavender-300" : "text-mist-500")}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{skill.name || "Skill"}</p>
                  <p className="mt-0.5 text-xs text-mist-400">
                    {skill.level ? `${skill.level} · ` : ""}
                    {count > 0 ? `${count} ${count === 1 ? "endorsement" : "endorsements"}` : "Player listed"}
                  </p>
                </div>
                {!own && viewer && (
                  <button
                    type="button"
                    aria-pressed={Boolean(skill.hasEndorsed)}
                    disabled={mutation.isPending}
                    onClick={() =>
                      mutation.mutate({
                        skillId: skill.id,
                        skillName: skill.name || "Skill",
                        alreadyEndorsed: Boolean(skill.hasEndorsed),
                      })
                    }
                    className={cn(
                      "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 ring-inset transition-colors",
                      skill.hasEndorsed
                        ? "bg-lavender-400/12 text-lavender-200 ring-lavender-400/40"
                        : "text-mist-300 ring-white/12 hover:bg-white/5 hover:text-mist-50",
                    )}
                  >
                    <Icon name={skill.hasEndorsed ? "check" : "endorse"} className="size-3.5" weight="bold" />
                    {skill.hasEndorsed ? "Endorsed" : "Endorse"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyLine>{own ? "Add your skills so other players can endorse them." : "No skills have been added yet."}</EmptyLine>
      )}
      {skills.length > 5 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-4 text-sm font-medium text-lavender-300 hover:text-lavender-200"
        >
          {showAll ? "Show fewer" : `Show all ${skills.length} skills`}
        </button>
      )}
      {mutation.isError && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {getApiErrorMessage(mutation.error, "The endorsement could not be updated.")}
        </p>
      )}
    </ProfileSection>
  );
}

export function ProfileOverview({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const info: Array<[string, string | number | null | undefined]> = [
    ["Full name", profile.personalInfo?.fullName],
    ["Player title", profile.gamerTitle],
    ["Level", profile.gameLevel],
    ["Region", profile.region],
    ["Age", profile.personalInfo?.age],
    ["Gender", profile.personalInfo?.gender],
    ["Location", profile.personalInfo?.location],
    ["Profession", profile.personalInfo?.profession],
    ["Email", profile.email],
    ["Phone", profile.personalInfo?.phone],
    ["Platforms", profile.platforms?.join(", ")],
  ];
  const visibleInfo = info.filter(([, value]) => value !== null && value !== undefined && value !== "");

  return (
    <div className="grid gap-4">
      <ProfileSection title="About">
        {profile.bio && <p className="mb-6 max-w-2xl text-[0.95rem] leading-relaxed text-mist-200">{profile.bio}</p>}
        {visibleInfo.length ? (
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleInfo.map(([name, value]) => (
              <div key={name} className="min-w-0">
                <dt className="text-xs text-mist-500">{name}</dt>
                <dd className="mt-1 truncate text-sm font-medium">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyLine>
            {own
              ? "Add a few details to make this profile easier to understand."
              : "This player hasn't shared more information yet."}
          </EmptyLine>
        )}
      </ProfileSection>
      {(profile.socialMedia ?? []).some((item) => item.url) ? (
        <ProfileSection title="Socials">
          <SocialLinks socials={profile.socialMedia} />
        </ProfileSection>
      ) : own ? (
        <ProfileSection title="Socials">
          <EmptyLine>Add your Twitch, YouTube, X or other channels from Edit profile so people can follow you.</EmptyLine>
        </ProfileSection>
      ) : null}
      <SkillsPanel own={own} profile={profile} />
      <NeedsPanel own={own} profile={profile} />
      {own && <ReferralPanel />}
    </div>
  );
}
