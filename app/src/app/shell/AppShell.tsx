import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RealtimeBridge } from "@/features/messages/RealtimeBridge";
import { cn } from "@/lib/cn";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { MobileNavigation } from "./MobileNavigation";
import { RouteScrollManager } from "./RouteScrollManager";
import { useHeartbeat } from "./useHeartbeat";

const collapsedKey = "Gamerie_sidebar_collapsed";

function readCollapsed() {
  try {
    return localStorage.getItem(collapsedKey) === "true";
  } catch {
    return false;
  }
}

export function AppShell() {
  useHeartbeat();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(collapsedKey, String(next));
      } catch {
        // The preference just won't persist.
      }
      return next;
    });
  };

  return (
    <div className="relative min-h-dvh bg-ink-950 text-mist-50">
      <RouteScrollManager />
      <RealtimeBridge />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(55%_100%_at_55%_0%,rgb(198_163_255/0.09),transparent)]"
      />
      <a
        href="#main-content"
        className="sr-only z-50 rounded-full bg-lavender-400 px-4 py-2 text-sm font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div className={cn("relative transition-[padding] duration-500 ease-out-expo", collapsed ? "lg:pl-19" : "lg:pl-64")}>
        <AppHeader />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[84rem] px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-8 outline-none sm:px-6 lg:px-10 lg:pb-16 lg:pt-10"
        >
          <ErrorBoundary resetKey={pathname} withinApp>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
