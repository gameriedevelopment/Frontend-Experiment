import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { useAuthStore } from "@/features/auth/authStore";
import { useCreateConversation } from "@/features/messages/hooks";
import { useTogglePlayerFollow } from "../hooks";
import { getProfileCompletion } from "../profileCompletion";
import type { PlayerProfile } from "../types";
import { NetworkDialog } from "./NetworkDialog";

function Cover({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative h-40 overflow-hidden rounded-panel bg-ink-900 ring-1 ring-inset ring-white/6 sm:h-52">
      {src && !failed ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(60%_90%_at_70%_0%,rgb(198_163_255/0.18),transparent)]" />
          <div className="halftone absolute inset-0 text-lavender-400/10 [mask-image:radial-gradient(70%_80%_at_70%_20%,black,transparent)]" />
        </>
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/70 to-transparent" />
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
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const createConversation = useCreateConversation();
  const follow = useTogglePlayerFollow(currentUser?.id, profile.id, Boolean(profile.isFollowedByCurrentUser));
  const [network, setNetwork] = useState<"followers" | "following" | null>(null);
  const location = profile.personalInfo?.location || profile.region;
  const followers = Number(profile.followersCount ?? profile.followers?.length ?? 0);
  const following = profile.following?.length ?? 0;

  const message = async () => {
    if (!currentUser) return;
    const conversation = await createConversation.mutateAsync({
      participantIds: [currentUser.id, profile.id],
      type: "user",
      name: profile.username,
      avatar: profile.profileImage,
    });
    navigate(`/messages?conversation=${conversation.id}`);
  };

  return (
    <section className="grid gap-6">
      <div>
        <Cover src={profile.backgroundImage} />
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
                {profile.gamerieId && <span className="type-label text-mist-500">{profile.gamerieId}</span>}
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
                <LinkButton to="/settings" tone="outline" size="sm" icon="edit">
                  Edit profile
                </LinkButton>
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
                  to={`/challenges?compose=user&target=${encodeURIComponent(profile.id)}&targetName=${encodeURIComponent(profile.username)}`}
                  tone="outline"
                  size="sm"
                  icon="challenges"
                >
                  Challenge
                </LinkButton>
                <Button
                  tone={profile.isFollowedByCurrentUser ? "outline" : "lavender"}
                  size="sm"
                  icon={profile.isFollowedByCurrentUser ? "check" : "follow"}
                  disabled={follow.isPending}
                  onClick={() => follow.mutate()}
                >
                  {profile.isFollowedByCurrentUser ? "Following" : "Follow"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-4 border-y border-white/6 px-2 py-4 sm:px-6">
        <Metric label="Followers" value={followers.toLocaleString()} onClick={() => setNetwork("followers")} />
        <Metric label="Following" value={following.toLocaleString()} onClick={() => setNetwork("following")} />
        <Metric label="Play level" value={profile.gameLevel || "Not set"} />
        <Metric label="Platforms" value={profile.platforms?.length ? profile.platforms.join(" · ") : "—"} />
      </div>

      {(createConversation.isError || follow.isError) && (
        <p role="alert" className="text-sm text-danger">
          That action could not be completed. Please try again.
        </p>
      )}
      {own && <CompletionMeter profile={profile} />}
      <NetworkDialog kind={network} profileId={profile.id} onClose={() => setNetwork(null)} />
    </section>
  );
}
