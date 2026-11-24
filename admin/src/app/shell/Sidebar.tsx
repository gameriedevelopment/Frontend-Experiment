import { NavLink, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { TokenMark } from "@/components/ui/TokenMark";
import { Kbd } from "@/components/layout/Kbd";
import { useSession } from "@/features/auth/session";
import { operatorName } from "@/features/auth/types";
import { useQueue } from "@/features/queue/hooks";
import { LANES, waited } from "@/features/queue/lanes";
import { cn } from "@/lib/cn";
import { NAV } from "./navigation";
import { usePalette } from "./palette";
import { QueueBadge } from "./QueueBadge";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const user = useSession((state) => state.user);
  const signOut = useSession((state) => state.signOut);
  const openPalette = usePalette((state) => state.setOpen);
  const navigate = useNavigate();
  const queue = useQueue();

  const badge = (keys: (typeof LANES)[number]["key"][] | undefined) => {
    if (!keys || !queue.data) return null;
    const lanes = LANES.filter((lane) => keys.includes(lane.key));
    const count = lanes.reduce((sum, lane) => sum + queue.data[lane.key].count, 0);
    const overdue = lanes.some((lane) => waited(queue.data[lane.key].oldestAt, lane.dueHours)?.overdue);
    return <QueueBadge count={count} overdue={overdue} className="ml-auto" />;
  };

  return (
    <aside className="flex h-full min-h-0 flex-col bg-ink-950">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <NavLink to="/" onClick={onNavigate} className="flex items-center gap-2.5 rounded-lg">
          <TokenMark className="h-7 text-lavender-400" />
          <span className="type-display text-[1.15rem] leading-none">Gamerie</span>
        </NavLink>
        <span className="type-label rounded-md bg-lavender-400/12 px-1.5 py-1 text-lavender-200 ring-1 ring-inset ring-lavender-400/25">Admin</span>
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            openPalette(true);
          }}
          className="flex h-10 w-full items-center gap-2.5 rounded-xl bg-white/4 px-3 text-sm text-mist-400 ring-1 ring-inset ring-white/8 transition-colors hover:bg-white/6 hover:text-mist-200"
        >
          <Icon name="search" className="size-4" />
          <span className="flex-1 text-left">Search or jump</span>
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 scrollbar-thin">
        {NAV.map((group) => {
          const items = group.items.filter((item) => !item.superAdmin || user?.isSuperAdmin);
          if (!items.length) return null;
          return (
            <div key={group.label} className="mt-5 first:mt-1">
              <p className="type-label px-3 pb-2 text-[0.6rem] text-mist-500">{group.label}</p>
              <ul className="grid gap-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "relative flex h-9 items-center gap-3 rounded-lg px-3 text-[0.9rem] transition-colors",
                          isActive
                            ? "bg-white/6 font-medium text-mist-50 before:absolute before:inset-y-2 before:-left-3 before:w-0.5 before:rounded-full before:bg-lavender-400"
                            : "text-mist-300 hover:bg-white/3 hover:text-mist-100",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon name={item.icon} weight={isActive ? "fill" : "regular"} className={cn("size-[1.1rem]", isActive ? "text-lavender-300" : "text-mist-500")} />
                          <span className="truncate">{item.label}</span>
                          {badge(item.lanes)}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/6 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar src={user?.profileImage} name={operatorName(user)} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{operatorName(user)}</span>
            <span className="block truncate font-mono text-[0.68rem] text-mist-500">{user?.isSuperAdmin ? "Super admin" : "Admin"} · {user?.email}</span>
          </span>
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => {
              signOut();
              navigate("/sign-in", { replace: true });
            }}
            className="grid size-8 place-items-center rounded-lg text-mist-400 transition-colors hover:bg-white/6 hover:text-mist-50"
          >
            <Icon name="signOut" className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
