import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/time";
import { notificationIcon, notificationTarget } from "../format";
import type { GamerieNotification } from "../types";

const toneClass = {
  lavender: "bg-lavender-400 text-ink-950",
  signal: "bg-signal text-ink-950",
  danger: "bg-danger text-ink-950",
  mist: "bg-mist-300 text-ink-950",
};

/** One notification: the actor or image with a type badge, the message, and when. Opening it marks it read. */
export function NotificationRow({ notification, onOpen, compact = false }: { notification: GamerieNotification; onOpen: (notification: GamerieNotification) => void; compact?: boolean }) {
  const navigate = useNavigate();
  const target = notificationTarget(notification);
  const { icon, tone } = notificationIcon(notification.type);
  const actor = typeof notification.data?.actorUsername === "string" ? notification.data.actorUsername : undefined;

  return (
    <button
      type="button"
      onClick={() => {
        onOpen(notification);
        if (target) navigate(target);
      }}
      className={cn(
        "group relative flex w-full items-start gap-3.5 rounded-2xl text-left transition-colors hover:bg-white/4",
        compact ? "px-3 py-2.5" : "px-4 py-3.5",
        !notification.isRead && "bg-lavender-400/5",
      )}
    >
      <span className="relative shrink-0">
        {notification.image || actor ? (
          <Avatar src={notification.image ?? undefined} name={actor ?? notification.title ?? "Gamerie"} size={compact ? "md" : "md"} className="rounded-full" />
        ) : (
          <span className="grid size-10 place-items-center rounded-full bg-white/6 text-mist-300">
            <Icon name={icon} className="size-[1.1rem]" />
          </span>
        )}
        {(notification.image || actor) && (
          <span className={cn("absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full ring-2 ring-ink-900", toneClass[tone])}>
            <Icon name={icon} weight="fill" className="size-3" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        {notification.title && <span className={cn("block text-sm", notification.isRead ? "text-mist-200" : "font-semibold text-mist-50")}>{notification.title}</span>}
        <span className={cn("block text-sm leading-relaxed", notification.title ? "text-mist-400" : notification.isRead ? "text-mist-300" : "text-mist-100", compact && "line-clamp-2")}>
          {notification.message}
        </span>
        <span className="mt-1 block text-xs text-mist-500">{timeAgo(notification.createdAt)}</span>
      </span>
      {!notification.isRead && <span aria-label="Unread" className="mt-2 size-2 shrink-0 rounded-full bg-lavender-400" />}
    </button>
  );
}
