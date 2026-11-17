import { motion } from "motion/react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { useAuthStore } from "@/features/auth/authStore";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgo, timeAgoLong } from "@/lib/time";
import { toast } from "@/lib/toast";
import { notifyPostLike, trackPostView, type ReportPayload } from "../api";
import { useCreateReport, useDeletePost, useEditPost, useTogglePostLike, useToggleRepost } from "../hooks";
import { getPostViews } from "../metrics";
import type { FeedPost, PostOwnerType } from "../types";
import { plainTextPreview } from "../richContent";
import { Comments } from "./Comments";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { PostMedia } from "./PostMedia";
import { RichText } from "./RichText";

export const postOwnerType = (post: FeedPost): PostOwnerType => (post.hubId ? "hub" : post.teamId ? "team" : "user");

export function postAuthor(post: FeedPost) {
  const author = post.author ?? post.user;
  return {
    id: String(author?.id ?? post.authorId ?? post.userId ?? ""),
    name: author?.displayName ?? author?.username ?? post.authorName ?? "Gamerie player",
    username: author?.username ?? post.authorName,
    image: author?.profileImage ?? author?.profilePictureUrl ?? post.authorImage ?? undefined,
  };
}

const mediaOf = (post: FeedPost) => (post.media?.length ? post.media : post.mediaUrl ? [post.mediaUrl] : []);
const likesOf = (post: FeedPost) =>
  typeof post.likesCount === "number" ? post.likesCount : Object.values(post.reactionCounts ?? {}).reduce((sum, count) => sum + Number(count || 0), 0);
function communityOf(post: FeedPost) {
  if (post.team?.name) return { ...post.team, kind: "Team", href: `/teams/${encodeURIComponent(post.team.slug || post.team.id)}` };
  if (post.hub?.name) return { ...post.hub, kind: "Hub", href: `/hubs/${encodeURIComponent(post.hub.slug || post.hub.id)}` };
  return null;
}

export const postHref = (post: FeedPost) => `/post/${post.id}${post.hubId ? `?hub=${post.hubId}` : post.teamId ? `?team=${post.teamId}` : ""}`;
const longPost = 520;
// One view ping per post per session; feed tabs and back-navigation remount cards.
const viewed = new Set<string>();
const compact = (value: number) => new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);

function Action({
  icon,
  label,
  count,
  active,
  activeClass,
  onClick,
  disabled,
}: {
  icon: IconName;
  label: string;
  count?: number;
  active?: boolean;
  activeClass?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium tabular-nums transition-colors hover:bg-white/5",
        active ? activeClass : "text-mist-400 hover:text-mist-100",
      )}
    >
      <motion.span key={String(active)} initial={active ? { scale: 0.6 } : false} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 15 }}>
        <Icon name={icon} weight={active ? "fill" : "regular"} className="size-[1.15rem]" />
      </motion.span>
      {count ? compact(count) : null}
    </button>
  );
}

function RepostEmbed({ post, interactive = true }: { post: FeedPost; interactive?: boolean }) {
  const author = postAuthor(post);
  const navigate = useNavigate();
  const open = (event: MouseEvent<HTMLDivElement>) => {
    if (!interactive || (event.target as HTMLElement).closest("a, button, video")) return;
    event.stopPropagation();
    navigate(postHref(post));
  };
  return (
    <div
      onClick={open}
      className={cn("grid gap-3 rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/8", interactive && "transition-colors hover:bg-white/5")}
    >
      <p className="flex items-center gap-2 text-sm">
        <Avatar src={author.image} name={author.name} size="sm" className="rounded-full" />
        <span className="font-semibold">{author.name}</span>
        <span className="text-xs text-mist-500">{timeAgo(post.createdAt)}</span>
      </p>
      <RichText content={post.content} compact className="line-clamp-6" />
      <PostMedia media={mediaOf(post)} mediaType={post.mediaType} />
    </div>
  );
}

const reportReasons: Array<{ value: ReportPayload["type"]; label: string }> = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "other", label: "Something else" },
];

function ReportPostDialog({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const user = useAuthStore((state) => state.user);
  const report = useCreateReport();
  const [type, setType] = useState<ReportPayload["type"]>("spam");
  const [reason, setReason] = useState("");
  const kind = postOwnerType(post);
  return (
    <Dialog
      open
      title="Report this post"
      description="Reports are private. Gamerie reviews them and acts on anything that breaks the rules."
      icon="flag"
      tone="danger"
      onClose={onClose}
      dismissible={!report.isPending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={report.isPending || !user?.id}
            onClick={() =>
              report.mutate(
                {
                  contentId: post.id,
                  contentType: kind === "user" ? "post" : kind === "team" ? "team-post" : "hub-post",
                  contentAuthorId: postAuthor(post).id,
                  reporterId: user!.id,
                  type,
                  reason: reason.trim() || reportReasons.find((item) => item.value === type)!.label,
                },
                {
                  onSuccess: () => {
                    toast.success("Report sent", "Thanks for keeping Gamerie safe.");
                    onClose();
                  },
                },
              )
            }
          >
            {report.isPending ? "Sending…" : "Send report"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <ChoiceGroup legend="What's wrong?" columns={2}>
          {reportReasons.map((item) => (
            <ChoiceChip key={item.value} name="post-report" value={item.value} checked={type === item.value} onChange={() => setType(item.value)} label={item.label} />
          ))}
        </ChoiceGroup>
        <TextAreaField id="post-report-details" label="Details (optional)" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
        {report.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(report.error, "The report wasn't sent.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}

function EditPostDialog({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const edit = useEditPost(post);
  const [content, setContent] = useState(String(post.content ?? ""));
  const changed = content.trim() !== String(post.content ?? "").trim();
  return (
    <Dialog
      open
      size="lg"
      title="Edit post"
      description="Markdown works: **bold**, _italic_, `code` and links."
      icon="edit"
      onClose={onClose}
      dismissible={!edit.isPending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            icon="check"
            disabled={!changed || !content.trim() || edit.isPending}
            onClick={() =>
              edit.mutate(content.trim(), {
                onSuccess: () => {
                  toast.success("Post updated");
                  onClose();
                },
              })
            }
          >
            {edit.isPending ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <TextAreaField id="edit-post" label="Post" maxLength={5000} value={content} onChange={(event) => setContent(event.target.value)} className="min-h-40" autoFocus />
        {edit.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(edit.error, "Your changes weren't saved.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}

export function PostCard({
  post,
  single = false,
  canDeleteOverride = false,
  onDeleted,
  className,
}: {
  post: FeedPost;
  single?: boolean;
  canDeleteOverride?: boolean;
  onDeleted?: () => void;
  className?: string;
}) {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const like = useTogglePostLike(post);
  const repost = useToggleRepost(post);
  const remove = useDeletePost(post);
  const [showComments, setShowComments] = useState(single);
  const [expanded, setExpanded] = useState(single);
  const [dialog, setDialog] = useState<null | "edit" | "delete" | "report" | "repost">(null);
  const cardRef = useRef<HTMLElement>(null);
  const [repostNote, setRepostNote] = useState("");
  const author = postAuthor(post);
  const community = communityOf(post);
  const authorHref = author.username ? `/profile/${encodeURIComponent(author.username)}` : "#";
  const own = Boolean(user?.id) && author.id === user?.id;
  const liked = Boolean(post.hasLiked ?? post.userReaction);
  const comments = Number(post.commentsCount ?? post.commentCount ?? post.totalComments ?? 0);
  const original = post.repostOf ?? post.originalPost;
  const views = own ? getPostViews(post) : 0;
  const media = mediaOf(post);
  const href = postHref(post);
  const canRepost = !post.hubId && !(post.teamId && original);
  const canDelete = own || canDeleteOverride;
  const clamp = !expanded && plainTextPreview(post.content).length > longPost;

  useEffect(() => {
    const node = cardRef.current;
    if (!node || single || viewed.has(post.id)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || viewed.has(post.id)) return;
        viewed.add(post.id);
        trackPostView(post.id).catch(() => undefined);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [post.id, single]);

  const toggleLike = async () => {
    try {
      await like.mutateAsync();
      if (!liked && user?.id && author.id && author.id !== user.id)
        notifyPostLike({ userId: user.id, targetId: author.id, contentType: "post", contentId: post.id }).catch(() => undefined);
    } catch {
      // The optimistic like is rolled back by the mutation.
    }
  };

  // Like X: a click on the post itself opens it, but never one on a control, a link, media, comments or a selection.
  const openPost = (event: MouseEvent<HTMLElement>) => {
    if (single || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (!event.currentTarget.contains(target)) return;
    if (target.closest("a, button, input, textarea, video, label, [role=menu], [data-post-comments]")) return;
    if (window.getSelection()?.toString()) return;
    if (event.metaKey || event.ctrlKey) window.open(href, "_blank", "noopener");
    else navigate(href);
  };

  const share = async () => {
    const url = `${window.location.origin}${href}`;
    try {
      if (navigator.share) await navigator.share({ url, title: `${author.name} on Gamerie` });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // Closing the share sheet isn't an error.
    }
  };

  const menuItems: MenuItem[] = [
    { label: "Copy link", icon: "copy", onSelect: () => void navigator.clipboard.writeText(`${window.location.origin}${href}`).then(() => toast.success("Link copied")) },
    ...(own ? [{ label: "Edit post", icon: "edit" as const, onSelect: () => setDialog("edit") }] : []),
    ...(canDelete ? [{ label: own ? "Delete post" : "Remove post", icon: "trash" as const, danger: true, onSelect: () => setDialog("delete") }] : []),
    ...(!own ? [{ label: "Report post", icon: "flag" as const, danger: true, onSelect: () => setDialog("report") }] : []),
  ];

  return (
    <article
      ref={cardRef}
      onClick={openPost}
      className={cn(
        "grid gap-4 rounded-card bg-ink-900/60 p-4 ring-1 ring-inset ring-white/6 transition-colors sm:p-5",
        !single && "cursor-pointer hover:bg-ink-900/85",
        className,
      )}
    >
      <header className="flex items-start gap-3">
        <Link to={community?.href ?? authorHref} className="shrink-0">
          {community ? (
            <Avatar src={community.logo ?? undefined} name={community.name} tone="ink" className="rounded-xl" />
          ) : (
            <Avatar src={author.image} name={author.name} className="rounded-full" />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2">
            <Link to={community?.href ?? authorHref} className="truncate font-semibold transition-colors hover:text-lavender-200">
              {community?.name ?? author.name}
            </Link>
            {community && <span className="type-label rounded-full bg-white/6 px-2 py-0.5 text-mist-400">{community.kind}</span>}
            {post.isAnnouncement && <span className="type-label rounded-full bg-lavender-400/14 px-2 py-0.5 text-lavender-300">Announcement</span>}
          </p>
          <p className="text-xs text-mist-500">
            {community && (
              <>
                by{" "}
                <Link to={authorHref} className="text-mist-300 hover:text-mist-50">
                  {author.name}
                </Link>
                {" · "}
              </>
            )}
            {single ? (
              <time dateTime={post.createdAt} title={timeAgoLong(post.createdAt)}>
                {post.createdAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(post.createdAt)) : ""}
              </time>
            ) : (
              <Link to={href} className="transition-colors hover:text-mist-200 hover:underline">
                <time dateTime={post.createdAt} title={timeAgoLong(post.createdAt)}>
                  {timeAgo(post.createdAt)}
                </time>
              </Link>
            )}
            {original && " · reposted"}
          </p>
        </div>
        <Menu label="Post options" items={menuItems} />
      </header>

      <div className="grid gap-2">
        <div className={cn(clamp && "relative max-h-64 overflow-hidden mask-[linear-gradient(to_bottom,black_60%,transparent)]")}>
          <RichText content={post.content} className={single ? "text-[1.0625rem]" : undefined} />
        </div>
        {clamp && (
          <button type="button" onClick={() => setExpanded(true)} className="w-fit text-sm font-medium text-lavender-300 hover:text-lavender-200">
            Show more
          </button>
        )}
      </div>
      <PostMedia media={media} mediaType={post.mediaType} />
      {!media.length && !original && <LinkPreviewCard content={String(post.content ?? "")} />}
      {original && <RepostEmbed post={original} />}
      {post.tags?.length ? (
        <p className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              to={`/search?tag=${encodeURIComponent(tag.replace(/^#/, ""))}`}
              className="rounded-full bg-lavender-400/10 px-2.5 py-1 text-xs font-medium text-lavender-300 transition-colors hover:bg-lavender-400/18 hover:text-lavender-200"
            >
              #{tag.replace(/^#/, "")}
            </Link>
          ))}
        </p>
      ) : null}

      <footer className="-mx-2 -mb-1 flex items-center gap-0.5">
        <Action icon="heart" label={liked ? "Unlike" : "Like"} count={likesOf(post)} active={liked} activeClass="text-danger" onClick={() => void toggleLike()} disabled={like.isPending} />
        <Action icon="comment" label="Comments" count={comments} active={showComments} activeClass="text-lavender-300" onClick={() => (single ? document.getElementById("comment-composer")?.focus() : setShowComments((value) => !value))} />
        <Action
          icon="repost"
          label={post.hasReposted ? "Undo repost" : "Repost"}
          count={Number(post.repostsCount ?? 0)}
          active={Boolean(post.hasReposted)}
          activeClass="text-signal"
          disabled={repost.isPending || own || !canRepost}
          onClick={() => (post.hasReposted ? repost.mutate("", { onSuccess: () => toast.info("Repost removed"), onError: (error) => toast.error("Couldn't undo the repost", getApiErrorMessage(error, "Try again in a moment.")) }) : setDialog("repost"))}
        />
        <Action icon="share" label="Share" onClick={() => void share()} />
        {own && views > 0 && (
          <span className="ml-auto flex items-center gap-1.5 pr-3 text-xs tabular-nums text-mist-500">
            <Icon name="eye" className="size-4" />
            {compact(views)}
          </span>
        )}
      </footer>

      {showComments && (
        <div data-post-comments className="cursor-auto">
          <Comments post={post} type={postOwnerType(post)} />
        </div>
      )}

      <ConfirmDialog
        open={dialog === "delete"}
        title={own ? "Delete this post?" : "Remove this post?"}
        description={own ? "It's removed from your profile and everyone's feed, with its comments." : "As an owner of this space you can take it down. It's removed for everyone."}
        confirmLabel={own ? "Delete post" : "Remove post"}
        icon="trash"
        pending={remove.isPending}
        error={remove.isError ? getApiErrorMessage(remove.error, "It couldn't be deleted.") : undefined}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              setDialog(null);
              toast.info(own ? "Post deleted" : "Post removed");
              onDeleted?.();
            },
          })
        }
        onClose={() => setDialog(null)}
      />
      {dialog === "report" && <ReportPostDialog post={post} onClose={() => setDialog(null)} />}
      {dialog === "edit" && <EditPostDialog post={post} onClose={() => setDialog(null)} />}
      {dialog === "repost" && (
        <Dialog
          open
          title="Repost"
          description="Share this with your followers, with a note if you like."
          icon="repost"
          onClose={() => setDialog(null)}
          dismissible={!repost.isPending}
          footer={
            <>
              <Button tone="ghost" size="sm" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                icon="repost"
                disabled={repost.isPending}
                onClick={() =>
                  repost.mutate(repostNote.trim(), {
                    onSuccess: () => {
                      setDialog(null);
                      setRepostNote("");
                      toast.success("Reposted");
                    },
                    onError: (error) => toast.error("Couldn't repost", getApiErrorMessage(error, "Try again in a moment.")),
                  })
                }
              >
                {repost.isPending ? "Reposting…" : "Repost"}
              </Button>
            </>
          }
        >
          <div className="grid gap-4">
            <TextAreaField id="repost-note" label="Your note (optional)" maxLength={500} value={repostNote} onChange={(event) => setRepostNote(event.target.value)} />
            <RepostEmbed post={post} interactive={false} />
          </div>
        </Dialog>
      )}
    </article>
  );
}
