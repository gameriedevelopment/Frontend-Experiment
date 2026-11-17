import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { signOut } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/authStore";
import { useTotalUnread } from "@/features/messages/hooks";
import { cn } from "@/lib/cn";
import { AppNavLink } from "./AppNavLink";
import { mobileMoreNavigation, mobileNavigation, type NavigationItem } from "./navigation";

const sheetLink =
  "flex flex-col items-center gap-2 rounded-2xl bg-white/4 px-2 py-3.5 text-xs font-medium text-mist-200 ring-1 ring-inset ring-white/6 transition-colors hover:bg-white/8";

function DockLink({ item, unread }: { item: NavigationItem; unread: number }) {
  const showUnread = item.href === "/messages" && unread > 0;
  return (
    <AppNavLink
      to={item.href}
      aria-label={showUnread ? `${item.label}, ${unread} unread` : item.label}
      className={({ isActive }) =>
        cn(
          "relative flex flex-1 flex-col items-center gap-1 py-2 text-[0.65rem] font-medium transition-colors",
          isActive ? "text-lavender-300" : "text-mist-400",
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={item.icon} weight={isActive ? "duotone" : "regular"} className="size-[1.35rem]" />
          {item.label}
          {showUnread && (
            <span
              aria-hidden="true"
              className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-lavender-400 px-1 text-[0.58rem] font-bold text-ink-950"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </>
      )}
    </AppNavLink>
  );
}

export function MobileNavigation() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const unread = Number(useTotalUnread().data ?? 0);
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  const logout = async () => {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setOpen(false);
    }
  };

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex items-stretch rounded-[1.4rem] bg-ink-900/85 px-1.5 py-1 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.8)] ring-1 ring-white/10 backdrop-blur-xl lg:hidden"
      >
        {mobileNavigation.map((item) => (
          <DockLink key={item.href} item={item} unread={unread} />
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          className="flex flex-1 flex-col items-center gap-1 py-2 text-[0.65rem] font-medium text-mist-400"
        >
          <Icon name="more" className="size-[1.35rem]" weight="bold" />
          More
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="More navigation">
            <m.button
              type="button"
              aria-label="Close more menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <m.section
              ref={sheetRef}
              className="absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto overscroll-contain rounded-t-panel bg-ink-900 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 ring-1 ring-white/10"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.5, ease: easeOutExpo }}
            >
              <span aria-hidden="true" className="mx-auto mb-4 block h-1 w-10 rounded-full bg-white/15" />
              <header className="flex items-center justify-between">
                <h2 className="type-display text-[1.35rem]">More</h2>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid size-10 place-items-center rounded-full text-mist-300 hover:bg-white/6"
                >
                  <Icon name="close" className="size-5" />
                </button>
              </header>

              <p className="type-label mb-3 mt-6 text-mist-500">Explore</p>
              <nav aria-label="Explore" className="grid grid-cols-3 gap-2">
                {mobileMoreNavigation.map((item) => (
                  <AppNavLink key={item.href} to={item.href} onClick={() => setOpen(false)} className={sheetLink}>
                    <Icon name={item.icon} className="size-[1.35rem] text-lavender-300" weight="duotone" />
                    {item.label}
                  </AppNavLink>
                ))}
              </nav>

              <p className="type-label mb-3 mt-7 text-mist-500">Account</p>
              <nav aria-label="Account" className="grid grid-cols-3 gap-2">
                <AppNavLink
                  to={`/profile/${user?.username ?? user?.id ?? ""}`}
                  onClick={() => setOpen(false)}
                  className={sheetLink}
                >
                  <Icon name="identity" className="size-[1.35rem] text-lavender-300" weight="duotone" />
                  Profile
                </AppNavLink>
                <AppNavLink to="/settings" onClick={() => setOpen(false)} className={sheetLink}>
                  <Icon name="settings" className="size-[1.35rem] text-lavender-300" weight="duotone" />
                  Settings
                </AppNavLink>
                <button type="button" onClick={() => void logout()} className={sheetLink}>
                  <Icon name="signOut" className="size-[1.35rem] text-danger" weight="duotone" />
                  Sign out
                </button>
              </nav>
            </m.section>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
