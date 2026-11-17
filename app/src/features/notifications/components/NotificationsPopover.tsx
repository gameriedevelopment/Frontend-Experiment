import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/features/auth/authStore";
import { flattenNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "../hooks";
import { NotificationRow } from "./NotificationRow";

/** The bell's quick look: the latest few, mark all read, and a way to the full list. */
export function NotificationsPopover({ trigger, className }: { trigger: ReactNode; className: string }) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const query = useNotifications(user?.id, { enabled: open, limit: 8, surface: "popover" });
  const markRead = useMarkNotificationRead(user?.id);
  const markAll = useMarkAllNotificationsRead(user?.id);
  const items = flattenNotifications(query.data).slice(0, 8);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => !rootRef.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={className}>
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-card bg-ink-800 shadow-[0_30px_80px_-24px_rgb(0_0_0/0.95)] ring-1 ring-white/10"
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/6 px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              <button
                type="button"
                disabled={markAll.isPending || !items.some((item) => !item.isRead)}
                onClick={() => markAll.mutate()}
                className="text-xs font-medium text-lavender-300 hover:text-lavender-200 disabled:text-mist-500"
              >
                Mark all read
              </button>
            </header>
            <div className="max-h-[min(28rem,70vh)] overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-white/12">
              {query.isLoading ? (
                <div aria-hidden="true" className="grid gap-1.5 p-1.5">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-14 rounded-2xl" />
                  ))}
                </div>
              ) : items.length ? (
                items.map((notification) => (
                  <NotificationRow key={notification.id} compact notification={notification} onOpen={(item) => !item.isRead && markRead.mutate(item.id)} />
                ))
              ) : (
                <p className="px-4 py-10 text-center text-sm text-mist-500">Nothing yet. Follows, challenges and team news show up here.</p>
              )}
            </div>
            <Link to="/notifications" className="block border-t border-white/6 px-4 py-3 text-center text-sm font-medium text-mist-200 hover:bg-white/3 hover:text-mist-50">
              See all notifications
            </Link>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
