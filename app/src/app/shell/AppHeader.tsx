import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, type IconName } from "@/components/ui/Icon";
import { TokenMark } from "@/components/ui/TokenMark";
import { useAuthStore } from "@/features/auth/authStore";
import { useTotalUnread } from "@/features/messages/hooks";
import { useNotificationUnreadCount } from "@/features/notifications/hooks";
import { cn } from "@/lib/cn";
import { AppNavLink } from "./AppNavLink";
import { ProfileMenu } from "./ProfileMenu";

const iconButton =
  "relative grid size-10 place-items-center rounded-full text-mist-300 transition-colors hover:bg-white/[0.06] hover:text-mist-50";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-lavender-400 px-1 text-[0.62rem] font-bold leading-none text-ink-950 ring-2 ring-ink-950"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function CountLink({ to, icon, label, count }: { to: string; icon: IconName; label: string; count: number }) {
  return (
    <AppNavLink
      to={to}
      aria-label={count ? `${label}, ${count} unread` : label}
      className={({ isActive }) => cn(iconButton, isActive && "bg-white/[0.07] text-mist-50")}
    >
      <Icon name={icon} className="size-[1.2rem]" />
      <CountBadge count={count} />
    </AppNavLink>
  );
}

export function AppHeader() {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.user?.id);
  const unreadMessages = Number(useTotalUnread().data ?? 0);
  const unreadNotifications = Number(useNotificationUnreadCount(userId).data ?? 0);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (event.key !== "/" || editing || event.metaKey || event.ctrlKey || event.altKey) return;
      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>("[data-global-search]");
      if (input) input.focus();
      else navigate("/search");
    };
    document.addEventListener("keydown", openSearch);
    return () => document.removeEventListener("keydown", openSearch);
  }, [navigate]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/6 bg-ink-950/75 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <AppNavLink to="/feed" aria-label="Gamerie feed" className="flex items-center gap-2.5 lg:hidden">
        <TokenMark className="h-6 text-lavender-400" />
        <span className="type-display text-[1rem] tracking-[0.04em]">Gamerie</span>
      </AppNavLink>

      <Link
        to="/search"
        className="hidden h-10 w-full max-w-md items-center gap-3 rounded-full bg-white/[0.04] px-4 text-sm text-mist-400 ring-1 ring-inset ring-white/8 transition-colors hover:bg-white/[0.07] hover:text-mist-200 sm:flex"
      >
        <Icon name="search" className="size-4" />
        Search players, teams and games
        <kbd className="type-label ml-auto rounded-md bg-white/8 px-1.5 py-1 text-mist-300">/</kbd>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <Link to="/search" aria-label="Search" className={cn(iconButton, "sm:hidden")}>
          <Icon name="search" className="size-[1.2rem]" />
        </Link>
        <CountLink to="/messages" icon="messages" label="Messages" count={unreadMessages} />
        <CountLink to="/notifications" icon="bell" label="Notifications" count={unreadNotifications} />
        <span aria-hidden="true" className="mx-1.5 hidden h-6 w-px bg-white/10 sm:block" />
        <ProfileMenu />
      </div>
    </header>
  );
}
