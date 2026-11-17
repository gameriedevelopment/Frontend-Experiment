import { m } from "motion/react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { TokenMark } from "@/components/ui/TokenMark";
import { useAuthStore } from "@/features/auth/authStore";
import { cn } from "@/lib/cn";
import { AppNavLink } from "./AppNavLink";
import { primaryNavigation, secondaryNavigation, type NavigationItem } from "./navigation";

function NavigationGroup({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: NavigationItem[];
  collapsed: boolean;
}) {
  return (
    <div className="grid gap-1">
      {collapsed ? (
        <span aria-hidden="true" className="mx-auto mb-2 h-px w-6 bg-white/10" />
      ) : (
        <p className="type-label mb-2 px-3 text-mist-500">{label}</p>
      )}
      <nav aria-label={label} className="grid gap-0.5">
        {items.map(({ href, icon, label: itemLabel }) => (
          <AppNavLink
            key={href}
            to={href}
            title={collapsed ? itemLabel : undefined}
            className={({ isActive }) =>
              cn(
                "relative flex h-10 items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-200",
                collapsed ? "justify-center" : "px-3",
                isActive ? "bg-white/7 text-mist-50" : "text-mist-400 hover:bg-white/4 hover:text-mist-50",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <m.span
                    layoutId="sidebar-active"
                    className="absolute -left-3 inset-y-2 w-1 rounded-r-full bg-lavender-400"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon
                  name={icon}
                  weight={isActive ? "duotone" : "regular"}
                  className={cn("size-[1.15rem]", isActive && "text-lavender-400")}
                />
                <span className={cn(collapsed && "sr-only")}>{itemLabel}</span>
              </>
            )}
          </AppNavLink>
        ))}
      </nav>
    </div>
  );
}

export function AppSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const user = useAuthStore((state) => state.user);
  const profileHref = `/profile/${user?.username ?? user?.id ?? ""}`;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/6 bg-ink-900/70 backdrop-blur-xl transition-[width] duration-500 ease-out-expo lg:flex",
        collapsed ? "w-19" : "w-64",
      )}
    >
      <AppNavLink
        to="/home"
        aria-label="Gamerie home"
        className={cn("flex h-16 shrink-0 items-center gap-2.5", collapsed ? "justify-center" : "px-6")}
      >
        <TokenMark className="h-6 text-lavender-400" />
        {!collapsed && <span className="type-display text-[1.05rem] tracking-[0.04em]">Gamerie</span>}
      </AppNavLink>

      <div className="flex flex-1 flex-col gap-7 overflow-y-auto overscroll-contain px-3 py-5 scrollbar-none">
        <NavigationGroup label="Network" items={primaryNavigation} collapsed={collapsed} />
        <NavigationGroup label="Your space" items={secondaryNavigation} collapsed={collapsed} />
      </div>

      <div className="grid gap-1 border-t border-white/6 p-3">
        <AppNavLink
          to={profileHref}
          title={collapsed ? "Your profile" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-white/5",
            collapsed && "justify-center",
          )}
        >
          <Avatar src={user?.profileImage} name={user?.username ?? user?.email} online={user?.isOnline} size="sm" />
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{user?.username ?? "Player"}</span>
              <span className="type-label mt-1 block text-[0.6rem] text-mist-500">View player ID</span>
            </span>
          )}
        </AppNavLink>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex h-9 items-center gap-3 rounded-xl text-[0.8rem] text-mist-500 transition-colors hover:bg-white/4 hover:text-mist-200",
            collapsed ? "justify-center" : "px-3",
          )}
        >
          <Icon name="sidebar" className={cn("size-[1.05rem] transition-transform", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
