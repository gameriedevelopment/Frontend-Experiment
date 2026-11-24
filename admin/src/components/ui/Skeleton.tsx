import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block animate-pulse rounded-xl bg-white/6 motion-reduce:animate-none", className)}
    />
  );
}

export function SkeletonText({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("grid gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-3 rounded-full", index === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </span>
  );
}
