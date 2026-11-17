import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmojiButton } from "@/components/ui/EmojiButton";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useAuthStore } from "@/features/auth/authStore";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { insertAtCursor } from "@/lib/insertAtCursor";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useCreateCommunityPost, useCreatePost } from "../hooks";
import { firstContentUrl } from "../richContent";
import { LinkPreviewCard } from "./LinkPreviewCard";

const maxLength = 3000;
const maxFiles = 4;
const accepted = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
const formats: Array<{ icon: IconName; label: string; before: string; after: string; fallback: string }> = [
  { icon: "bold", label: "Bold", before: "**", after: "**", fallback: "bold text" },
  { icon: "italic", label: "Italic", before: "_", after: "_", fallback: "italic text" },
  { icon: "code", label: "Code", before: "`", after: "`", fallback: "code" },
  { icon: "link", label: "Link", before: "[", after: "](https://)", fallback: "link text" },
];

/** Write a post to your profile and followers' feeds, with up to four images or clips. */
export function PostComposer({
  placeholder = "Share a result, a clip, or what you're playing",
  community,
}: {
  placeholder?: string;
  /** Post to a team or hub wall instead of your own profile. */
  community?: { kind: "team" | "hub"; id: string; name: string; canAnnounce?: boolean };
}) {
  const user = useAuthStore((state) => state.user);
  const personal = useCreatePost(user?.id);
  const communityPost = useCreateCommunityPost(community?.kind ?? "team", community?.id ?? "", user?.id);
  const create = community ? communityPost : personal;
  const [announcement, setAnnouncement] = useState(false);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pickingEmoji, setPickingEmoji] = useState(false);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const settled = useDebouncedValue(content, 600);
  const previewUrl = firstContentUrl(settled);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const addFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []).filter((file) => accepted.includes(file.type) && file.size <= 25 * 1024 * 1024);
    if (picked.length < (list?.length ?? 0)) toast.error("Some files were skipped", "Use images or MP4/WebM clips up to 25 MB.");
    setFiles((current) => [...current, ...picked].slice(0, maxFiles));
  };

  const format = (item: (typeof formats)[number]) => {
    const node = textRef.current;
    if (!node) return;
    const { selectionStart: start, selectionEnd: end } = node;
    const selected = content.slice(start, end) || item.fallback;
    const next = `${content.slice(0, start)}${item.before}${selected}${item.after}${content.slice(end)}`;
    if (next.length > maxLength) return;
    setContent(next);
    requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(start + item.before.length, start + item.before.length + selected.length);
    });
  };

  const submit = () => {
    if (!canPost) return;
    create.mutate(
      { content: content.trim(), media: files.length ? files : undefined, isAnnouncement: community?.canAnnounce ? announcement : undefined },
      {
        onSuccess: () => {
          setContent("");
          setFiles([]);
          setFocused(false);
          setDismissedUrl(null);
          setAnnouncement(false);
          toast.success(
            announcement ? "Announcement posted" : "Posted",
            community ? `It's on ${community.name}'s wall.` : "It's on your profile and your followers' feeds.",
          );
        },
      },
    );
  };

  const expanded = focused || content.length > 0 || files.length > 0;
  const canPost = (content.trim().length > 0 || files.length > 0) && !create.isPending;

  return (
    <section
      aria-label="Create a post"
      onBlur={(event) => {
        if (!pickingEmoji && !event.currentTarget.contains(event.relatedTarget) && !content.trim() && !files.length) setFocused(false);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        if (!event.dataTransfer.files.length) return;
        event.preventDefault();
        setDragging(false);
        setFocused(true);
        addFiles(event.dataTransfer.files);
      }}
      className={cn(
        "relative grid gap-3 rounded-card bg-ink-900/60 p-4 ring-1 ring-inset transition-shadow sm:p-5",
        dragging ? "ring-2 ring-lavender-400" : expanded ? "ring-lavender-400/30" : "ring-white/6",
      )}
    >
      {dragging && (
        <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-card bg-ink-950/80 backdrop-blur-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-lavender-200">
            <Icon name="image" className="size-5" />
            Drop to attach
          </p>
        </div>
      )}
      <div className="flex gap-3">
        <Avatar src={user?.profileImage} name={user?.username} className="rounded-full" />
        <label className="min-w-0 flex-1">
          <span className="sr-only">Post content</span>
          <textarea
            ref={textRef}
            value={content}
            maxLength={maxLength}
            onFocus={() => setFocused(true)}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                submit();
              }
            }}
            onPaste={(event) => {
              if (!event.clipboardData.files.length) return;
              event.preventDefault();
              addFiles(event.clipboardData.files);
            }}
            placeholder={placeholder}
            className={cn(
              "field-sizing-content block w-full resize-none bg-transparent py-2 text-[0.95rem] leading-relaxed outline-none placeholder:text-mist-500 pointer-coarse:text-base",
              expanded ? "min-h-24" : "min-h-10",
            )}
          />
        </label>
      </div>

      {previews.length > 0 && (
        <ul className="grid grid-cols-4 gap-2 pl-13">
          {previews.map((url, index) => (
            <li key={url} className="relative aspect-square overflow-hidden rounded-xl bg-ink-850 ring-1 ring-white/8">
              {files[index]?.type.startsWith("video/") ? (
                <video src={url} className="size-full object-cover" muted />
              ) : (
                <img src={url} alt="" className="size-full object-cover" />
              )}
              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink-950/80 text-mist-100 hover:bg-ink-950"
              >
                <Icon name="close" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!files.length && previewUrl && previewUrl !== dismissedUrl && (
        <div className="sm:pl-13">
          <LinkPreviewCard content={settled} onDismiss={() => setDismissedUrl(previewUrl)} />
        </div>
      )}

      {expanded && (
        <div className="flex items-center gap-1 border-t border-white/6 pt-3 sm:pl-13">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={files.length >= maxFiles}
            className="flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-mist-300 transition-colors hover:bg-white/5 hover:text-mist-50 disabled:opacity-40"
          >
            <Icon name="image" className="size-[1.1rem] text-lavender-300" />
            Media
          </button>
          <EmojiButton onOpenChange={setPickingEmoji} onPick={(emoji) => setContent((current) => insertAtCursor(textRef.current, current, emoji, maxLength))} />
          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-white/8 sm:block" />
          <div role="toolbar" aria-label="Formatting" className="hidden items-center sm:flex">
            {formats.map((item) => (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                title={item.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => format(item)}
                className="grid size-9 place-items-center rounded-full text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-50"
              >
                <Icon name={item.icon} className="size-4" />
              </button>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={accepted.join(",")}
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
          {community?.canAnnounce && (
            <button
              type="button"
              aria-pressed={announcement}
              onClick={() => setAnnouncement((value) => !value)}
              className={cn(
                "ml-1 flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors",
                announcement ? "bg-lavender-400/14 text-lavender-200" : "text-mist-400 hover:bg-white/5 hover:text-mist-50",
              )}
            >
              <Icon name="megaphone" className="size-4" />
              <span className="hidden sm:inline">Announcement</span>
            </button>
          )}
          <span className={cn("ml-auto text-xs tabular-nums", content.length > maxLength - 200 ? "text-lavender-300" : "text-mist-500")}>
            {content.length > maxLength - 500 ? `${maxLength - content.length} left` : ""}
          </span>
          <Button size="sm" icon="send" disabled={!canPost} onClick={submit}>
            {create.isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      )}
      {create.isError && (
        <p role="alert" className="text-sm text-danger">
          {getApiErrorMessage(create.error, "Your post wasn't published.")}
        </p>
      )}
    </section>
  );
}
