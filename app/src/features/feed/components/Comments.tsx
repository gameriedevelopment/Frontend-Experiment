import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmojiButton } from "@/components/ui/EmojiButton";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/features/auth/authStore";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { insertAtCursor } from "@/lib/insertAtCursor";
import { toast } from "@/lib/toast";
import { timeAgo, timeAgoLong } from "@/lib/time";
import { notifyPostComment } from "../api";
import { useAddComment, useDeleteComment, useEditComment, usePostComments, useToggleCommentLike } from "../hooks";
import type { FeedComment, FeedPost, PostOwnerType } from "../types";
import { RichText } from "./RichText";

const commentAuthor = (comment: FeedComment) => {
  const author = comment.author ?? comment.user;
  return {
    id: String(author?.id ?? comment.authorId ?? comment.userId ?? ""),
    name: author?.displayName ?? author?.username ?? comment.authorName ?? "Player",
    username: author?.username ?? comment.authorName,
    image: author?.profileImage ?? author?.profilePictureUrl ?? comment.authorImage ?? undefined,
  };
};

const likedBy = (comment: FeedComment, userId?: string) =>
  Boolean(userId) && (comment.likes ?? []).some((like) => (typeof like === "string" ? like : like.id) === userId);

function CommentRow({
  comment,
  postId,
  type,
  depth,
  onReply,
}: {
  comment: FeedComment;
  postId: string;
  type: PostOwnerType;
  depth: number;
  onReply: (comment: FeedComment) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const like = useToggleCommentLike(postId, type);
  const remove = useDeleteComment(postId);
  const edit = useEditComment(postId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirming, setConfirming] = useState(false);
  const author = commentAuthor(comment);
  const liked = likedBy(comment, user?.id);
  const likes = Number(comment.likesCount ?? comment.likes?.length ?? 0);
  const own = Boolean(user?.id) && author.id === user?.id;

  const save = () => {
    const clean = draft.trim();
    if (!clean || edit.isPending) return;
    if (clean === String(comment.content ?? "").trim()) return setEditing(false);
    edit.mutate(
      { commentId: comment.id, content: clean },
      {
        onSuccess: () => setEditing(false),
        onError: (error) => toast.error("Couldn't save the comment", getApiErrorMessage(error, "Try again in a moment.")),
      },
    );
  };

  return (
    <li className="grid gap-3">
      <div className="flex gap-3">
        <Link to={author.username ? `/profile/${encodeURIComponent(author.username)}` : "#"} className="shrink-0">
          <Avatar src={author.image} name={author.name} size="sm" className="rounded-full" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl rounded-tl-md bg-white/4 px-3.5 py-2.5 ring-1 ring-inset ring-white/6">
            <p className="flex items-baseline gap-2 text-sm">
              <span className="truncate font-semibold">{author.name}</span>
              <time dateTime={comment.createdAt} title={timeAgoLong(comment.createdAt)} className="shrink-0 text-xs text-mist-500">
                {timeAgo(comment.createdAt)}
              </time>
            </p>
            {editing ? (
              <div className="mt-2 grid gap-2">
                <label className="relative">
                  <span className="sr-only">Edit comment</span>
                  <textarea
                    autoFocus
                    rows={1}
                    value={draft}
                    maxLength={2000}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setEditing(false);
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        save();
                      }
                    }}
                    className="field-sizing-content block max-h-40 min-h-10 w-full resize-none rounded-xl bg-ink-950/60 px-3 py-2 text-sm outline-none pointer-coarse:text-base ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-lavender-400"
                  />
                </label>
                <div className="flex items-center justify-end gap-3 text-xs font-medium">
                  <span className="mr-auto text-mist-500">Enter to save · Esc to cancel</span>
                  <button type="button" onClick={() => setEditing(false)} className="text-mist-400 hover:text-mist-100">
                    Cancel
                  </button>
                  <button type="button" disabled={!draft.trim() || edit.isPending} onClick={save} className="text-lavender-300 hover:text-lavender-200 disabled:opacity-40">
                    {edit.isPending ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <RichText content={comment.content} compact className="mt-1" />
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-4 pl-2 text-xs font-medium text-mist-500">
            <button
              type="button"
              aria-pressed={liked}
              onClick={() => like.mutate({ commentId: comment.id, liked }, { onError: (error) => toast.error("Couldn't update the like", getApiErrorMessage(error, "Try again in a moment.")) })}
              className={cn("flex items-center gap-1 transition-colors hover:text-mist-200", liked && "text-lavender-300")}
            >
              <Icon name="heart" weight={liked ? "fill" : "regular"} className="size-3.5" />
              {likes > 0 ? likes : "Like"}
            </button>
            {depth === 0 && (
              <button type="button" onClick={() => onReply(comment)} className="flex items-center gap-1 transition-colors hover:text-mist-200">
                <Icon name="reply" className="size-3.5" />
                Reply
              </button>
            )}
            {own && !editing && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(String(comment.content ?? ""));
                    setEditing(true);
                  }}
                  className="transition-colors hover:text-mist-200"
                >
                  Edit
                </button>
                <button type="button" onClick={() => setConfirming(true)} className="transition-colors hover:text-danger">
                  Delete
                </button>
              </>
            )}
          </div>
          <ConfirmDialog
            open={confirming}
            title="Delete this comment?"
            description={comment.replies?.length ? "Its replies go with it." : "It's removed for everyone."}
            confirmLabel="Delete"
            icon="trash"
            pending={remove.isPending}
            onConfirm={() =>
              remove.mutate(comment.id, {
                onSuccess: () => {
                  setConfirming(false);
                  toast.info("Comment deleted");
                },
                onError: (error) => toast.error("Couldn't delete the comment", getApiErrorMessage(error, "Try again in a moment.")),
              })
            }
            onClose={() => setConfirming(false)}
          />
        </div>
      </div>
      {comment.replies?.length ? (
        <ul className="ml-11 grid gap-3 border-l border-white/6 pl-4">
          {comment.replies.map((reply) => (
            <CommentRow key={reply.id} comment={reply} postId={postId} type={type} depth={depth + 1} onReply={onReply} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function Comments({ post, type }: { post: FeedPost; type: PostOwnerType }) {
  const user = useAuthStore((state) => state.user);
  const query = usePostComments(post.id, type);
  const add = useAddComment();
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<FeedComment | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const clean = content.trim();
    if (!clean || !user?.id) return;
    try {
      await add.mutateAsync({ postId: post.id, content: clean, parentCommentId: replyingTo?.id ?? null, type });
      setContent("");
      setReplyingTo(null);
      const targetId = String(post.authorId ?? post.author?.id ?? post.userId ?? "");
      if (targetId && targetId !== user.id)
        notifyPostComment({ userId: user.id, targetId, contentType: "post", contentId: post.id }).catch(() => undefined);
    } catch {
      // Shown under the composer.
    }
  };

  return (
    <section aria-label="Comments" className="grid gap-4 border-t border-white/6 pt-4">
      {query.isLoading ? (
        <div aria-hidden="true" className="grid gap-3">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
      ) : query.data?.length ? (
        <ul className="grid gap-4">
          {query.data.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              postId={post.id}
              type={type}
              depth={0}
              onReply={(target) => {
                setReplyingTo(target);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-mist-500">No comments yet. Start the conversation.</p>
      )}

      <div className="grid gap-2">
        {replyingTo && (
          <p className="flex items-center gap-2 text-xs text-mist-400">
            Replying to <span className="font-semibold text-mist-200">{commentAuthor(replyingTo).name}</span>
            <button type="button" onClick={() => setReplyingTo(null)} className="text-mist-500 hover:text-mist-200">
              Cancel
            </button>
          </p>
        )}
        <div className="flex items-end gap-3">
          <Avatar src={user?.profileImage} name={user?.username} size="sm" className="mb-1 rounded-full" />
          <label className="relative flex-1">
            <span className="sr-only">Write a comment</span>
            <textarea
              ref={inputRef}
              id="comment-composer"
              rows={1}
              value={content}
              maxLength={2000}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              placeholder="Write a comment"
              className="field-sizing-content block max-h-40 min-h-11 w-full resize-none rounded-2xl bg-white/4 py-2.5 pl-4 pr-20 text-sm outline-none pointer-coarse:text-base ring-1 ring-inset ring-white/10 placeholder:text-mist-500 focus:ring-2 focus:ring-lavender-400"
            />
            <EmojiButton
              onPick={(emoji) => setContent((current) => insertAtCursor(inputRef.current, current, emoji, 2000))}
              className="absolute bottom-1.5 right-10 size-8"
            />
            <button
              type="button"
              aria-label="Send comment"
              disabled={!content.trim() || add.isPending}
              onClick={() => void submit()}
              className="absolute bottom-1.5 right-1.5 grid size-8 place-items-center rounded-xl bg-lavender-400 text-ink-950 transition-opacity disabled:opacity-30"
            >
              <Icon name="send" weight="fill" className="size-4" />
            </button>
          </label>
        </div>
        {add.isError && (
          <p role="alert" className="text-xs text-danger">
            {getApiErrorMessage(add.error, "Your comment wasn't posted.")}
          </p>
        )}
      </div>
    </section>
  );
}
