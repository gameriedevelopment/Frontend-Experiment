import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLinkPreview } from "../hooks";
import { firstContentUrl } from "../richContent";

function internalPath(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.origin === window.location.origin ? `${parsed.pathname}${parsed.search}` : null;
  } catch {
    return null;
  }
}

export function LinkPreviewCard({ content, onDismiss }: { content: string; onDismiss?: () => void }) {
  const url = firstContentUrl(content);
  const query = useLinkPreview(url);
  const [imageFailed, setImageFailed] = useState(false);
  if (!url) return null;
  if (query.isLoading && onDismiss)
    return (
      <div aria-label="Loading link preview" className="flex gap-4 rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/8">
        <div className="grid flex-1 content-center gap-2">
          <Skeleton className="h-2.5 w-1/3 rounded-full" />
          <Skeleton className="h-3 w-4/5 rounded-full" />
          <Skeleton className="h-2.5 w-3/5 rounded-full" />
        </div>
        <Skeleton className="h-16 w-24 rounded-xl" />
      </div>
    );
  const preview = query.data;
  if (!preview || (!preview.title && !preview.image)) return null;

  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();
  const local = internalPath(url);
  const body = (
    <>
      <span className="grid min-w-0 flex-1 content-center gap-1 p-4">
        <span className="type-label truncate text-mist-500">{preview.siteName || host}</span>
        {preview.title && <span className="line-clamp-2 text-sm font-semibold text-mist-50 group-hover:text-lavender-100">{preview.title}</span>}
        {preview.description && <span className="line-clamp-2 text-xs leading-relaxed text-mist-400">{preview.description}</span>}
        <span className="mt-1 flex items-center gap-1 text-xs text-mist-500">
          <Icon name="external" className="size-3" />
          {host}
        </span>
      </span>
      {preview.image && !imageFailed && (
        <img src={preview.image} alt="" loading="lazy" onError={() => setImageFailed(true)} className="w-28 shrink-0 object-cover sm:w-40" />
      )}
    </>
  );
  const cardClass = "group flex min-h-24 overflow-hidden rounded-2xl bg-white/3 ring-1 ring-inset ring-white/8 transition-colors hover:bg-white/5 hover:ring-white/14";

  return (
    <div className="relative">
      {local ? (
        <Link to={local} className={cardClass}>
          {body}
        </Link>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className={cardClass}>
          {body}
        </a>
      )}
      {onDismiss && (
        <button
          type="button"
          aria-label="Remove link preview"
          onClick={onDismiss}
          className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-ink-950/70 text-mist-300 ring-1 ring-inset ring-white/10 backdrop-blur hover:text-mist-50"
        >
          <Icon name="close" className="size-3.5" />
        </button>
      )}
    </div>
  );
}
