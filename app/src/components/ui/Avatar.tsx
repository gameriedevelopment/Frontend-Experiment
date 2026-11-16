import { cva, type VariantProps } from "class-variance-authority";
import { useState } from "react";
import { cn } from "@/lib/cn";

const avatarVariants = cva(
  "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-lavender-400 font-sans font-bold uppercase text-ink-950",
  {
    variants: {
      size: {
        sm: "size-8 text-[0.68rem]",
        md: "size-10 text-xs",
        lg: "size-14 text-base",
      },
    },
    defaultVariants: { size: "md" },
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
      <span className={avatarVariants({ size })}>
        {src && !failed ? (
          <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
        ) : (
          initials(name)
        )}
      </span>
      {online && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-signal ring-2 ring-ink-950"
        />
      )}
    </span>
  );
}
