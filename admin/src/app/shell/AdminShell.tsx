import { AnimatePresence, m } from "motion/react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { ENVIRONMENT } from "@/lib/env";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { usePalette } from "./palette";
import { useShortcuts } from "./useShortcuts";

// The palette and its dependencies download the first time someone opens it.
const CommandPalette = lazy(() => import("./CommandPalette").then((module) => ({ default: module.CommandPalette })));

function PageFallback() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-20 w-full max-w-xl rounded-card" />
      <Skeleton className="h-72 rounded-card" />
    </div>
  );
}

export function AdminShell() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const paletteWanted = usePalette((state) => state.open);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  useEffect(() => {
    if (paletteWanted) setPaletteLoaded(true);
  }, [paletteWanted]);
  useShortcuts();
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      {ENVIRONMENT === "production" && <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5 bg-danger" />}
      <div className="sticky top-0 hidden h-dvh border-r border-white/6 lg:block">
        <Sidebar />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <m.div className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <m.div
              className="relative h-full w-[min(18rem,85vw)] border-r border-white/8"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <div className="min-w-0">
        <TopBar onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[90rem] px-4 pb-20 pt-8 sm:px-6 lg:px-10 lg:pt-10">
          <ErrorBoundary resetKey={pathname} withinApp>
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      {paletteLoaded && (
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      )}
    </div>
  );
}
