import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { useAuthStore } from "@/features/auth/authStore";
import { useCreateConversation } from "@/features/messages/hooks";
import { useGpGuide } from "@/features/progression/guideStore";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { usePlayerConnections, useTogglePlayerFollow } from "../hooks";
import { getProfileCompletion } from "../profileCompletion";
import type { PlayerProfile } from "../types";
import { NetworkDialog } from "./NetworkDialog";
import { PlayerIdBadge } from "./PlayerIdBadge";

function Cover({ src, editable }: { src?: string; editable: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative h-40 overflow-hidden rounded-panel bg-ink-900 ring-1 ring-inset ring-white/6 sm:h-52">
      {editable && (
        <Link
          to="?edit=photos"
          aria-label="Change cover and photo"
          className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-ink-950/60 px-3 py-2 text-xs font-semibold text-mist-100 ring-1 ring-inset ring-white/15 backdrop-blur transition-colors hover:bg-ink-950/80"
        >
          <Icon name="camera" className="size-4" />
          <span className="hidden sm:inline">Edit photos</span>
        </Link>
      )}
      {src && !failed ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(60%_90%_at_70%_0%,rgb(198_163_255/0.18),transparent)]" />
          <div className="halftone absolute inset-0 text-lavender-400/10 [mask-image:radial-gradient(70%_80%_at_70%_20%,black,transparent)]" />
        </>
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink-950/70 to-transparent" />
    </div>
  );
}

function Metric({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  const content = (
    <>
      <span className="block text-lg font-semibold tabular-nums">{value}</span>
      <span className="block text-xs text-mist-400">{label}</span>
    </>
  );
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="rounded-xl px-1 text-left transition-colors hover:text-lavender-200"
    >
      {content}
    </button>
  ) : (
    <div className="px-1">{content}</div>
  );
}

function CompletionMeter({ profile }: { profile: PlayerProfile }) {
  const completion = getProfileCompletion(profile);
  const next = completion.missing[0];
  if (completion.score >= 100 || !next) return null;
  return (
    <aside
      aria-label={`Profile ${completion.score}% complete`}
      className="flex flex-col gap-4 rounded-card bg-ink-900/70 p-5 ring-1 ring-inset ring-white/6 sm:flex-row sm:items-center sm:gap-6"
    >
      <span className="type-display text-[1.6rem] leading-none text-lavender-300">{completion.score}%</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Your player ID is {completion.score}% complete</p>
        <p className="mt-0.5 text-sm text-mist-400">
          Next: {next.label}
          {completion.missing.length > 1 ? `, and ${completion.missing.length - 1} more` : ""}.
        </p>
        <div
          role="progressbar"
          aria-label="Profile completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completion.score}
          className="mt-3 h-1 overflow-hidden rounded-full bg-white/8"
        >
          <div className="h-full rounded-full bg-lavender-400" style={{ width: `${completion.score}%` }} />
        </div>
      </div>
      <Link to={next.route} className="shrink-0 text-sm font-semibold text-lavender-300 hover:text-lavender-200">
        {next.action}
      </Link>
    </aside>
  );
}

export function ProfileHeader({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const openGuide = useGpGuide((state) => state.openGuide);
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const createConversation = useCreateConversation();
  const follow = useTogglePlayerFollow(currentUser?.id, profile.id, Boolean(profile.isFollowedByCurrentUser));
  const [network, setNetwork] = useState<"followers" | "following" | null>(null);
  const [unfollowArmed, setUnfollowArmed] = useState(true);
  const location = profile.personalInfo?.location || profile.region;
  const followerPages = usePlayerConnections(profile.id, "followers");
  const followingPages = usePlayerConnections(profile.id, "following");
  const followers = followerPages.data?.pages[0]?.total ?? Number(profile.followersCount ?? profile.followers?.length ?? 0);
  const following = followingPages.data?.pages[0]?.total ?? profile.following?.length;

  const message = async () => {
    if (!currentUser) return;
    try {
      const conversation = await createConversation.mutateAsync({
        participantIds: [currentUser.id, profile.id],
        type: "user",
        name: profile.username,
        avatar: profile.profileImage,
      });
      navigate(`/messages?conversation=${conversation.id}`);
    } catch (error) {
      toast.error("Couldn't open a conversation", getApiErrorMessage(error, "Try again in a moment."));
    }
  };

  const toggleFollow = () => {
    const wasFollowing = Boolean(profile.isFollowedByCurrentUser);
    if (!wasFollowing) setUnfollowArmed(false);
    follow.mutate(undefined, {
      onSuccess: () => {
        if (wasFollowing) toast.info(`Unfollowed ${profile.username}`);
      },
      onError: (error) => toast.error(wasFollowing ? "Couldn't unfollow" : "Couldn't follow", getApiErrorMessage(error, "Try again in a moment.")),
    });
  };

  return (
    <section className="grid gap-6">
      <div>
        <Cover src={profile.backgroundImage} editable={own} />
        <div className="relative -mt-12 flex flex-col gap-6 px-2 sm:-mt-14 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            <Avatar
              src={profile.profileImage}
              name={profile.username}
              online={profile.isOnline}
              size="xl"
              className="self-start rounded-full ring-[6px] ring-ink-950"
            />
            <div className="min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="type-display truncate text-heading">{profile.username}</h1>
                {profile.progression && (
                  <Tag tone="lavender" size="md">
                    Level {Math.max(0, Number(profile.progression.level) || 0)}
                  </Tag>
                )}
                {profile.gamerieId && <PlayerIdBadge id={profile.gamerieId} />}
              </div>
              <p className="mt-2 text-[0.95rem] text-mist-300">
                {profile.gamerTitle || profile.bio || "Building a place in the Gamerie community."}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mist-500">
                {location && (
                  <span className="flex items-center gap-1.5">
                    <Icon name="mapPin" className="size-4" />
                    {location}
                  </span>
                )}
                {profile.isOnline && (
                  <span className="flex items-center gap-1.5 text-signal">
                    <span className="size-1.5 rounded-full bg-signal" />
                    Online now
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {own ? (
              <>
                <LinkButton to={`/card/${encodeURIComponent(profile.username)}`} tone="outline" size="sm" icon="share">
                  Share card
                </LinkButton>
                <LinkButton to="?edit=identity" tone="outline" size="sm" icon="edit">
                  Edit profile
                </LinkButton>
                <Button tone="outline" size="sm" icon="trophy" aria-haspopup="dialog" onClick={openGuide}>
                  Earn GP
                </Button>
              </>
            ) : (
              <>
                <Button
                  tone="outline"
                  size="sm"
                  icon="messages"
                  disabled={createConversation.isPending}
                  onClick={() => void message()}
                >
                  Message
                </Button>
                <LinkButton
                  to={`/challenges/new?target=${encodeURIComponent(profile.id)}&targetName=${encodeURIComponent(profile.username)}`}
                  tone="outline"
                  size="sm"
                  icon="challenges"
                >
                  Challenge
                </LinkButton>
                {profile.isFollowedByCurrentUser ? (
                  <Button
                    tone="outline"
                    size="sm"
                    aria-pressed="true"
                    disabled={follow.isPending}
                    onClick={toggleFollow}
                    onMouseLeave={() => setUnfollowArmed(true)}
                    className={cn(unfollowArmed && "hover:text-danger")}
                  >
                    <span className={cn(unfollowArmed && "group-hover/button:hidden")}>Following</span>
                    <span className={cn("hidden", unfollowArmed && "group-hover/button:inline")}>Unfollow</span>
                    <Icon name="check" className={cn("size-4", unfollowArmed && "group-hover/button:hidden")} />
                    <Icon name="close" className={cn("hidden size-4", unfollowArmed && "group-hover/button:block")} />
                  </Button>
                ) : (
                  <Button size="sm" icon="follow" disabled={follow.isPending} onClick={toggleFollow}>
                    Follow
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-4 border-y border-white/6 px-2 py-4 sm:px-6">
        <Metric label="Followers" value={followers.toLocaleString()} onClick={() => setNetwork("followers")} />
        <Metric label="Following" value={following != null ? following.toLocaleString() : "—"} onClick={() => setNetwork("following")} />
        <Metric label="Play level" value={profile.gameLevel || "Not set"} />
        <Metric label="Platforms" value={profile.platforms?.length ? profile.platforms.join(" · ") : "—"} />
      </div>

      {own && <CompletionMeter profile={profile} />}
      <NetworkDialog
        kind={network}
        profileId={profile.id}
        username={profile.username}
        onSwitch={setNetwork}
        onClose={() => setNetwork(null)}
      />
    </section>
  );
}
