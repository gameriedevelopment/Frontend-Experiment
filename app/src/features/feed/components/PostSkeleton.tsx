import { Skeleton } from "@/components/ui/Skeleton";

export function PostSkeleton({ count = 2, media = true }: { count?: number; media?: boolean }) {
  return (
    <div aria-hidden="true" className="grid gap-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="grid gap-4 rounded-card bg-ink-900/60 p-4 ring-1 ring-inset ring-white/6 sm:p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-3 w-32 rounded-full" />
              <Skeleton className="h-2.5 w-16 rounded-full" />
            </div>
          </div>
          <div className="grid gap-2.5">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-4/5 rounded-full" />
          </div>
          {media && index % 2 === 0 && <Skeleton className="aspect-16/9 rounded-2xl" />}
        </div>
      ))}
    </div>
  );
}
