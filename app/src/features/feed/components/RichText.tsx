import { useMemo, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { renderRichContent } from "../richContent";

/** Post and comment text: markdown rendered, sanitized, and styled to the Gamerie palette. */
export function RichText({ content, compact = false, className }: { content?: string; compact?: boolean; className?: string }) {
  const html = useMemo(() => renderRichContent(content), [content]);
  const navigate = useNavigate();
  if (!html) return null;

  // Rendered links are plain anchors; route the in-app ones without reloading the app.
  const route = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest("a");
    const href = anchor?.getAttribute("href");
    if (!href?.startsWith("/") || href.startsWith("//") || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(href);
  };

  return (
    <div
      onClick={route}
      className={cn(
        "prose prose-invert max-w-none break-words text-mist-100",
        "prose-p:my-0 prose-p:leading-relaxed [&_p+p]:mt-3",
        "prose-a:font-medium prose-a:text-lavender-300 prose-a:no-underline hover:prose-a:text-lavender-200 hover:prose-a:underline",
        "prose-strong:text-mist-50 prose-headings:text-mist-50 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2",
        "prose-code:rounded-md prose-code:bg-white/6 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.85em] prose-code:text-lavender-200 prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:rounded-2xl prose-pre:bg-ink-950 prose-pre:ring-1 prose-pre:ring-white/8",
        "prose-blockquote:border-lavender-400/50 prose-blockquote:text-mist-300 prose-blockquote:not-italic",
        "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-li:marker:text-lavender-300 prose-img:rounded-2xl",
        compact ? "text-sm" : "text-[0.95rem]",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
