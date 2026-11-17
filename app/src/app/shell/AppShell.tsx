import { useState } from "react";
import { Outlet } from "react-router-dom";
import { RealtimeBridge } from "@/features/messages/RealtimeBridge";
import { cn } from "@/lib/cn";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { MobileNavigation } from "./MobileNavigation";
import { RouteScrollManager } from "./RouteScrollManager";
import { RouteTitle } from "./RouteTitle";
import { useHeartbeat } from "./useHeartbeat";

const collapsedKey = "Gamerie_sidebar_collapsed";

export function AppShell() {
  useHeartbeat();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(collapsedKey) === "true");

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(collapsedKey, String(next));
      return next;
    });
  };

  return (
    <div className="relative min-h-svh bg-ink-950 text-mist-50">
      <RouteScrollManager />
      <RouteTitle />
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
          className="mx-auto w-full max-w-[84rem] px-4 pb-32 pt-8 outline-none sm:px-6 lg:px-10 lg:pb-16 lg:pt-10"
        >
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
