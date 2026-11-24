import { cn } from "@/lib/cn";
import { TokenMark } from "./TokenMark";

export function LoadingMark({ label, className }: { label: string; className?: string }) {
  return (
    <div role="status" className={cn("grid place-items-center gap-5 text-center", className)}>
      <TokenMark className="h-12 animate-pulse text-lavender-400 motion-reduce:animate-none" />
      <div className="grid gap-3">
        <span className="type-label text-mist-400">{label}</span>
        <span className="relative mx-auto h-0.5 w-24 overflow-hidden rounded-full bg-white/8">
          <span className="absolute inset-y-0 left-0 w-1/3 animate-sweep rounded-full bg-lavender-400 motion-reduce:animate-none" />
        </span>
      </div>
    </div>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return <LoadingMark label={label} className="min-h-[50svh]" />;
}

export function FullScreenLoader({ label }: { label: string }) {
  return (
    <main className="grid min-h-svh place-items-center bg-ink-950">
      <LoadingMark label={label} />
    </main>
  );
}
