import { useEffect } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { StatePanel } from "@/components/ui/StatePanel";
import { useAuthStore } from "@/features/auth/authStore";
import { trackPostView } from "./api";
import { PostCard, postAuthor } from "./components/PostCard";
import { PostInsights } from "./components/PostInsights";
import { PostSkeleton } from "./components/PostSkeleton";
import { useHubPostContext, useSinglePost, useTeamPostContext } from "./hooks";

export function PostPage() {
  const { postId } = useParams();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const teamParam = params.get("team") || undefined;
  const hubParam = params.get("hub") || undefined;
  const query = useSinglePost(postId, teamParam, hubParam);
  const post = query.data;
  const hubId = hubParam ?? post?.hubId ?? undefined;
  const teamId = teamParam ?? post?.teamId ?? undefined;
  const hub = useHubPostContext(hubId);
  const team = useTeamPostContext(teamId);
  const author = post ? postAuthor(post) : null;
  const own = Boolean(user?.id && author?.id === user.id);
  const moderator = Boolean(user?.id && (hub.data?.ownerId === user.id || team.data?.ownerId === user.id));
  const cameFromApp = location.key !== "default";

  useEffect(() => {
    if (postId) trackPostView(postId).catch(() => undefined);
  }, [postId]);

  const back = () => (cameFromApp ? navigate(-1) : navigate("/feed"));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <button type="button" onClick={back} className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-mist-50">
        <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
        {cameFromApp ? "Back" : "Feed"}
      </button>

      {query.isLoading ? (
        <div className="mx-auto w-full max-w-2xl">
          <PostSkeleton count={1} />
        </div>
      ) : query.isError || !post ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="This post isn't available"
          description="It may have been removed, or Gamerie couldn't load it right now."
          action={
            <div className="flex gap-2">
              <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
                Try again
              </Button>
              <LinkButton to="/feed" tone="ghost" size="sm">
                Go to feed
              </LinkButton>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
          <div className="mx-auto w-full max-w-2xl">
            <PostCard post={post} single canDeleteOverride={moderator} onDeleted={() => navigate("/feed", { replace: true })} />
          </div>
          <aside className="grid gap-6 xl:sticky xl:top-24">
            {own && <PostInsights post={post} />}
            {author && !own && (
              <section className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6">
                <p className="type-label text-mist-500">Posted by</p>
                <Link
                  to={author.username ? `/profile/${encodeURIComponent(author.username)}` : "#"}
                  className="group mt-4 flex items-center gap-3"
                >
                  <Avatar src={author.image} name={author.name} size="lg" className="rounded-full" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold group-hover:text-lavender-200">{author.name}</span>
                    {author.username && <span className="block truncate text-sm text-mist-500">@{author.username}</span>}
                  </span>
                </Link>
                {author.username && (
                  <LinkButton to={`/profile/${encodeURIComponent(author.username)}`} tone="outline" size="sm" icon="arrowRight" className="mt-5 w-full">
                    View profile
                  </LinkButton>
                )}
              </section>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
