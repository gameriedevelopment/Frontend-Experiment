import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { useAuthStore } from "@/features/auth/authStore";
import { PlayerCard } from "./components/PlayerCard";
import { ProfileAchievements } from "./components/ProfileAchievements";
import { ProfileGames } from "./components/ProfileGames";
import { ProfileCareer } from "./components/career/ProfileCareer";
import { EditProfileDialog, type EditSection } from "./components/EditProfileDialog";
import { ProfileHeader } from "./components/ProfileHeader";
import { ProfileMatches } from "./components/ProfileMatches";
import { ProfileOverview } from "./components/ProfileOverview";
import { ProfilePosts } from "./components/ProfilePosts";
import { usePlayerProfile } from "./hooks";
import { buildPlayerCardModel } from "./playerCard";
import type { PlayerProfile, ProfileTab } from "./types";

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "info", label: "Overview" },
  { id: "career", label: "Career" },
  { id: "games", label: "Games" },
  { id: "matches", label: "Matches" },
  { id: "posts", label: "Posts" },
  { id: "achievements", label: "Achievements" },
];

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading player profile" className="grid gap-6">
      <Skeleton className="h-40 rounded-panel sm:h-52" />
      <div className="-mt-14 flex items-end gap-5 px-6">
        <Skeleton className="size-24 rounded-full sm:size-28" />
        <div className="grid flex-1 gap-3 pb-2">
          <Skeleton className="h-7 w-48 rounded-full" />
          <SkeletonText lines={1} className="max-w-xs" />
        </div>
      </div>
      <Skeleton className="h-16" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="hidden h-120 rounded-card lg:block" />
      </div>
    </div>
  );
}

function TabContent({ own, profile, tab }: { own: boolean; profile: PlayerProfile; tab: ProfileTab }) {
  if (!own && (profile.profileVisibility === "private" || profile.profileVisibility === "friends"))
    return (
      <StatePanel
        icon="lock"
        title={profile.profileVisibility === "private" ? "This profile is private" : "Visible to connections"}
        description={
          profile.profileVisibility === "private"
            ? "This player has chosen to keep their full identity private."
            : "Follow this player to see the details they share with their network."
        }
      />
    );
  if (tab === "games") return <ProfileGames own={own} profile={profile} />;
  if (tab === "matches") return <ProfileMatches own={own} profile={profile} />;
  if (tab === "achievements") return <ProfileAchievements own={own} profile={profile} />;
  if (tab === "career") return <ProfileCareer own={own} profile={profile} />;
  if (tab === "posts") return <ProfilePosts own={own} profile={profile} />;
  return <ProfileOverview own={own} profile={profile} />;
}

export function ProfilePage() {
  const { username } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const [params, setParams] = useSearchParams();
  const query = usePlayerProfile(username);
  const cardModel = useMemo(() => (query.data ? buildPlayerCardModel(query.data) : null), [query.data]);

  if (query.isLoading) return <ProfileSkeleton />;
  if (query.isError || !query.data)
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="Player profile unavailable"
        description="This profile may not exist, or Gamerie couldn't load it right now."
        action={
          <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
            Try again
          </Button>
        }
      />
    );

  const profile = query.data;
  const own = currentUser?.id === profile.id;
  const availableTabs = tabs.filter((item) => item.id !== "matches" || own || profile.showGameActivity !== false);
  const requested = params.get("tab") as ProfileTab | null;
  const tab = availableTabs.some((item) => item.id === requested) ? requested! : "info";

  const editSections: EditSection[] = ["photos", "identity", "personal", "skills", "links"];
  const requestedEdit = params.get("edit") as EditSection | null;
  const editing = own && requestedEdit ? (editSections.includes(requestedEdit) ? requestedEdit : "identity") : null;
  const setEdit = (section: EditSection | null) => {
    const nextParams = new URLSearchParams(params);
    if (section) nextParams.set("edit", section);
    else nextParams.delete("edit");
    setParams(nextParams, { replace: true });
  };

  const changeTab = (next: ProfileTab) => {
    const nextParams = new URLSearchParams(params);
    if (next === "info") nextParams.delete("tab");
    else nextParams.set("tab", next);
    setParams(nextParams, { replace: true });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <ProfileHeader own={own} profile={profile} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6">
          <Tabs
            label="Profile sections"
            items={availableTabs}
            value={tab}
            onChange={changeTab}
            indicatorId="profile-tab"
          />
          <TabContent own={own} profile={profile} tab={tab} />
        </div>

        {cardModel && (
          <aside aria-label="Player card" className="hidden lg:sticky lg:top-24 lg:block">
            <PlayerCard model={cardModel} />
          </aside>
        )}
      </div>
      {editing && <EditProfileDialog profile={profile} section={editing} onSection={setEdit} onClose={() => setEdit(null)} />}
    </div>
  );
}
