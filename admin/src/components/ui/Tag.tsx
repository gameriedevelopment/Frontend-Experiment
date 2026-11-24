import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const tagVariants = cva(
  "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full type-label",
  {
    variants: {
      tone: {
        muted: "bg-white/7 text-mist-300",
        lavender: "bg-lavender-400/14 text-lavender-300",
        signal: "bg-signal/12 text-signal",
        ink: "bg-ink-950 text-lavender-200",
        paper: "bg-ink-950/6 text-lavender-700",
        solid: "bg-lavender-400 text-ink-950",
      },
      size: {
        sm: "h-6 px-2.5",
        md: "h-8 px-3.5",
      },
    },
    defaultVariants: { tone: "muted", size: "sm" },
  },
);

type TagProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof tagVariants> & {
    dot?: boolean | "live";
  };

export function Tag({ tone, size, dot, className, children, ...props }: TagProps) {
  return (
    <span className={cn(tagVariants({ tone, size }), className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 rounded-full bg-current",
            dot === "live" && "animate-blink motion-reduce:animate-none",
          )}
        />
      )}
      {children}
    </span>
  );
}
