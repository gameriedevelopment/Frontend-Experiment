import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { renderRichText } from "@/lib/richText";

/** Post and comment text, formatted the way the player wrote it. */
export function RichText({ content, className }: { content: unknown; className?: string }) {
  const html = useMemo(() => renderRichText(content), [content]);
  if (!html) return <p className={cn("text-sm italic text-mist-500", className)}>No text</p>;
  return (
    <div
      className={cn(
        "min-w-0 break-words text-sm leading-relaxed text-mist-100",
        "[&>*+*]:mt-3 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold",
        "[&_strong]:font-semibold [&_strong]:text-mist-50 [&_em]:italic [&_del]:text-mist-500",
        "[&_a]:text-lavender-300 [&_a]:underline [&_a]:decoration-lavender-400/40 [&_a]:underline-offset-2 [&_a:hover]:decoration-lavender-300",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:pl-5 [&_li+li]:mt-1 [&_li::marker]:text-mist-500",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-white/15 [&_blockquote]:pl-3 [&_blockquote]:text-mist-300",
        "[&_code]:rounded [&_code]:bg-white/8 [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.8em]",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-ink-950/70 [&_pre]:p-3 [&_pre]:ring-1 [&_pre]:ring-inset [&_pre]:ring-white/8 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_hr]:border-white/10 [&_table]:w-full [&_table]:text-left [&_td]:py-1 [&_td]:pr-3 [&_th]:py-1 [&_th]:pr-3 [&_th]:font-semibold",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
