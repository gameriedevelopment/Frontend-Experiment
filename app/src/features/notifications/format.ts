import type { IconName } from "@/components/ui/Icon";
import type { GamerieNotification } from "./types";

/** Where a notification leads. Hub invites and join requests open the hub with the answer dialog. */
export function notificationTarget(notification: GamerieNotification) {
  const data = notification.data ?? {};
  if (notification.type === "hub-invite" || notification.type === "hub-join-request") {
    const hub = data.hubSlug || data.hubId;
    if (typeof hub === "string") {
      const params = new URLSearchParams({ membershipAction: notification.type });
      if (typeof data.requestId === "string") params.set("requestId", data.requestId);
      if (typeof data.actorId === "string") params.set("actorId", data.actorId);
      return `/hubs/${encodeURIComponent(hub)}?${params.toString()}`;
    }
  }
  if (notification.link?.startsWith("/")) return notification.link;
  if (typeof data.postId === "string") return `/post/${data.postId}`;
  if (typeof data.challengeId === "string") return `/challenges/${data.challengeId}`;
  if (typeof data.tournamentId === "string") return `/tournaments/${data.tournamentId}`;
  if (typeof data.leagueId === "string") return `/leagues/${data.leagueId}`;
  if (typeof data.ladderId === "string") return `/ladders/${data.ladderId}`;
  if (typeof data.actorUsername === "string") return `/profile/${encodeURIComponent(data.actorUsername)}`;
  return null;
}

export function notificationIcon(value: string | undefined): { icon: IconName; tone: "lavender" | "signal" | "danger" | "mist" } {
  const type = typeof value === "string" ? value : "";
  if (type === "like") return { icon: "heart", tone: "danger" };
  if (type === "comment") return { icon: "comment", tone: "lavender" };
  if (type === "repost") return { icon: "repost", tone: "lavender" };
  if (type === "ladder") return { icon: "ladders", tone: "lavender" };
  if (type === "league") return { icon: "leagues", tone: "lavender" };
  if (type === "follow" || type === "hub-follow" || type === "endorse") return { icon: "follow", tone: "lavender" };
  if (type.endsWith("announcement")) return { icon: "megaphone", tone: "lavender" };
  if (type.startsWith("hub")) return { icon: "hub", tone: "lavender" };
  if (type.startsWith("team")) return { icon: "team", tone: "lavender" };
  if (type.startsWith("tournament")) return { icon: "trophy", tone: "lavender" };
  if (type.includes("challenge") || type === "match") return { icon: "challenges", tone: "lavender" };
  if (type === "achievement") return { icon: "crown", tone: "signal" };
  if (type.includes("wallet")) return { icon: "wallet", tone: "mist" };
  if (type === "event-reminder") return { icon: "calendar", tone: "lavender" };
  return { icon: "bell", tone: "mist" };
}

export function groupLabel(value: string) {
  const days = Math.floor((new Date(new Date().toDateString()).getTime() - new Date(new Date(value).toDateString()).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This week";
  return "Earlier";
}
