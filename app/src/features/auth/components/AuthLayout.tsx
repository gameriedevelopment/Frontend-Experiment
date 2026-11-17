import type { ReactNode } from "react";
import { TokenMark } from "@/components/ui/TokenMark";
import { publicLinks } from "@/config/links";
import { cn } from "@/lib/cn";

function Brand({ className }: { className?: string }) {
  return (
    <a href={publicLinks.website} aria-label="Gamerie website" className={cn("flex items-center gap-2.5", className)}>
      <TokenMark className="h-6 text-lavender-400" />
      <span className="type-display text-[1.05rem] tracking-[0.04em]">Gamerie</span>
    </a>
  );
}

function AuthStage({ title, copy }: { title: readonly [string, string]; copy: string }) {
  return (
    <aside className="relative hidden overflow-hidden rounded-panel bg-ink-900 ring-1 ring-inset ring-white/6 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(45%_40%_at_50%_38%,rgb(198_163_255/0.1),transparent)]"
      />
      <div
        aria-hidden="true"
        className="halftone-coarse absolute inset-x-0 top-[16%] mx-auto h-[44%] w-[14%] min-w-24 text-lavender-400/80 [mask-composite:intersect] [mask-image:url(/token-mask.svg),linear-gradient(160deg,black_20%,transparent_95%)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain,100%_100%]"
      />

      <Brand className="relative" />

      <div className="relative">
        <p className="type-display text-display-md">
          <span className="block">{title[0]}</span>
          <span className="block text-lavender-400">{title[1]}</span>
        </p>
        <p className="mt-5 max-w-sm text-[1.05rem] leading-relaxed text-mist-300">{copy}</p>
      </div>
    </aside>
  );
}

export function AuthLayout({
  stageTitle,
  stageCopy = "Your record, your teams and your next match are waiting.",
  aside,
  children,
}: {
  stageTitle: readonly [string, string];
  stageCopy?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-svh bg-ink-950 text-mist-50 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-3 lg:p-3">
      <AuthStage title={stageTitle} copy={stageCopy} />
      <section className="flex min-h-svh flex-col px-gutter py-6 lg:min-h-0 lg:px-14 lg:py-9">
        <header className="flex items-center justify-between gap-4">
          <Brand className="lg:invisible" />
          {aside && <div className="text-sm text-mist-400">{aside}</div>}
        </header>
        <div className="mx-auto my-auto w-full max-w-104 py-12">{children}</div>
        <footer className="text-center text-xs leading-relaxed text-mist-500">
          By continuing, you agree to Gamerie's{" "}
          <a className="text-mist-300 underline-offset-4 hover:underline" href={publicLinks.terms}>
            Terms
          </a>{" "}
          and{" "}
          <a className="text-mist-300 underline-offset-4 hover:underline" href={publicLinks.privacy}>
            Privacy Policy
          </a>
          .
        </footer>
      </section>
    </main>
  );
}

export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div>
      <h1 className="text-[1.9rem] font-semibold leading-tight tracking-[-0.025em]">{title}</h1>
      {description && <p className="mt-2 text-[0.95rem] leading-relaxed text-mist-400">{description}</p>}
    </div>
  );
}
