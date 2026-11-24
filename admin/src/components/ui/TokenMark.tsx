import { cn } from "@/lib/cn";

export function TokenMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 100"
      aria-hidden="true"
      focusable="false"
      className={cn("h-6 w-auto fill-current", className)}
    >
      <circle cx="16" cy="16" r="16" />
      <rect x="0" y="35" width="32" height="65" rx="16" />
    </svg>
  );
}
