import { cva, type VariantProps } from "class-variance-authority";
import { useState } from "react";
import { cn } from "@/lib/cn";

const avatarVariants = cva(
  "relative grid shrink-0 place-items-center overflow-hidden font-sans font-bold uppercase",
  {
    variants: {
      size: {
        xs: "size-6 text-[0.55rem]",
        sm: "size-8 text-[0.68rem]",
        md: "size-10 text-xs",
        lg: "size-14 text-base",
        xl: "size-24 text-2xl sm:size-28",
      },
      tone: {
        brand: "bg-lavender-400 text-ink-950",
        ink: "bg-ink-950 text-lavender-300 ring-1 ring-inset ring-white/10",
      },
      /** People are round; teams, hubs and competitions are square. */
      shape: {
        circle: "rounded-full",
        square: "rounded-[28%]",
      },
    },
    defaultVariants: { size: "md", tone: "brand", shape: "circle" },
  },
);

function initials(name?: string) {
  return (name?.trim() || "G").slice(0, 2);
}

export function Avatar({
  src,
  name,
  online,
  size,
  tone,
  shape,
  className,
}: VariantProps<typeof avatarVariants> & {
  src?: string;
  name?: string;
  online?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("relative inline-flex", className)}>
      <span className={avatarVariants({ size, tone, shape })}>
        {src && !failed ? (
          <img src={src} alt="" loading="lazy" decoding="async" className="size-full object-cover" onError={() => setFailed(true)} />
        ) : (
          initials(name)
        )}
      </span>
      {online && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute rounded-full bg-signal ring-ink-950",
            size === "xl" ? "bottom-1.5 right-1.5 size-4 ring-4" : "-bottom-0.5 -right-0.5 size-3 ring-2",
          )}
        />
      )}
    </span>
  );
}
