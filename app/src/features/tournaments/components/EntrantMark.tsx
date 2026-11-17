import { useState } from "react";
import { cn } from "@/lib/cn";
import { initials } from "../utils";

const sizes = {
  xs: "size-6 rounded-md text-[0.55rem]",
  sm: "size-7 rounded-lg text-[0.6rem]",
  md: "size-10 rounded-xl text-xs",
  lg: "size-14 rounded-2xl text-sm",
} as const;

/** A team or player mark: their image, or initials on a tinted tile. */
export function EntrantMark({
  name,
  src,
  size = "md",
  className,
}: {
  name?: string | null;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden bg-lavender-400/14 font-semibold text-lavender-200 ring-1 ring-inset ring-white/10",
        sizes[size],
        className,
      )}
    >
      {src && !failed ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
