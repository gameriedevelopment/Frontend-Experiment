import { TokenMark } from "@/components/ui/TokenMark";
import { cn } from "@/lib/cn";

export function Brand({ className }: { className?: string }) {
  return (
    <a href="#top" aria-label="Gamerie home" className={cn("flex items-center gap-2.5", className)}>
      <TokenMark className="h-6 text-lavender-400" />
      <span className="type-display text-[1.05rem] tracking-[0.04em]">Gamerie</span>
    </a>
  );
}
