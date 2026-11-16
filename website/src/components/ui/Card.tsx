import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const cardVariants = cva("relative isolate overflow-hidden", {
  variants: {
    surface: {
      stage: "bg-ink-900 text-mist-50 ring-1 ring-inset ring-white/8",
      glass: "bg-ink-900/72 text-mist-50 ring-1 ring-inset ring-white/10 backdrop-blur-xl",
      paper: "bg-white/75 text-ink-950 ring-1 ring-inset ring-ink-950/8",
      outline: "text-ink-950 ring-1 ring-inset ring-ink-950/12",
      lavender: "bg-lavender-400 text-ink-950",
    },
    radius: {
      tile: "rounded-tile",
      card: "rounded-card",
      panel: "rounded-panel",
    },
    padding: {
      none: "",
      sm: "p-5",
      md: "p-6 sm:p-7",
      lg: "p-7 sm:p-10 lg:p-14",
    },
    interactive: {
      true: "transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1",
      false: "",
    },
  },
  defaultVariants: {
    surface: "stage",
    radius: "card",
    padding: "md",
    interactive: false,
  },
});

type CardProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

export function Card({
  surface,
  radius,
  padding,
  interactive,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(cardVariants({ surface, radius, padding, interactive }), className)}
      {...props}
    />
  );
}
