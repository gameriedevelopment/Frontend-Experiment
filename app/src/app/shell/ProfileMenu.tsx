import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Icon, type IconName } from "@/components/ui/Icon";
import { easeOutExpo } from "@/components/ui/motion";
import { signOut } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/authStore";

const menuItem =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-mist-200 transition-colors hover:bg-white/6 hover:text-mist-50";

export function ProfileMenu() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeMenu = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [open]);

  const logout = async () => {
    try {
      setLogoutError(null);
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Sign out failed. Please try again.");
    }
  };

  const links: Array<{ to: string; label: string; icon: IconName }> = [
    { to: `/profile/${user?.username ?? user?.id ?? ""}`, label: "View profile", icon: "identity" },
    { to: "/settings", label: "Settings", icon: "settings" },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-full p-1 pr-1 transition-colors hover:bg-white/5 sm:pr-3"
      >
        <Avatar src={user?.profileImage} name={user?.username ?? user?.email} online={user?.isOnline} size="sm" />
        <span className="hidden max-w-36 truncate text-sm font-semibold sm:block">{user?.username ?? "Player"}</span>
        <Icon name="chevronDown" className="hidden size-3.5 text-mist-400 sm:block" weight="bold" />
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.25, ease: easeOutExpo }}
            className="absolute right-0 top-[calc(100%+0.6rem)] w-64 origin-top-right rounded-card bg-ink-900/95 p-2 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b border-white/6 px-3 pb-3 pt-2">
              <Avatar src={user?.profileImage} name={user?.username ?? user?.email} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user?.username ?? "Player"}</p>
                <p className="truncate text-xs text-mist-400">{user?.email}</p>
              </div>
            </div>
            <div className="grid gap-0.5 py-2">
              {links.map((link) => (
                <Link key={link.to} role="menuitem" to={link.to} onClick={() => setOpen(false)} className={menuItem}>
                  <Icon name={link.icon} className="size-[1.1rem] text-mist-400" />
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-white/6 pt-2">
              <button type="button" role="menuitem" onClick={() => void logout()} className={menuItem}>
                <Icon name="signOut" className="size-[1.1rem] text-mist-400" />
                Sign out
              </button>
              {logoutError && (
                <p role="alert" className="px-3 pb-1 text-xs text-danger">
                  {logoutError}
                </p>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
