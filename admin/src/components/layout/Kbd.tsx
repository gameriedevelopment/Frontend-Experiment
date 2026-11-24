import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-grid h-5 min-w-5 place-items-center rounded-md bg-white/6 px-1.5 font-mono text-[0.65rem] font-medium text-mist-300 ring-1 ring-inset ring-white/10",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
