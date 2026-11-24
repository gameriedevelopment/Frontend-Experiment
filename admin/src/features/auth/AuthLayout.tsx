import type { ReactNode } from "react";
import { TokenMark } from "@/components/ui/TokenMark";

/** The frame shared by sign-in and invitation screens. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div aria-hidden="true" className="halftone absolute inset-0 text-lavender-400/12 mask-[radial-gradient(65%_55%_at_20%_85%,black,transparent)]" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-40 size-[36rem] rounded-full bg-lavender-400/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <TokenMark className="h-8 text-lavender-400" />
          <span className="type-display text-xl leading-none">Gamerie</span>
        </div>
        <div className="relative">
          <p className="type-display text-display-md leading-[0.9]">
            Run the
            <br />
            <span className="text-lavender-400">arena.</span>
          </p>
          <p className="mt-6 max-w-sm text-mist-400">Players, competitions and safety, in one place.</p>
        </div>
      </aside>
      <main className="grid place-items-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-12 flex items-center gap-2.5 lg:hidden">
            <TokenMark className="h-7 text-lavender-400" />
            <span className="type-display text-lg leading-none">Gamerie</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
