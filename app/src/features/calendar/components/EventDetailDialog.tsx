import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Icon, type IconName } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useUpdateCalendarEventStatus } from "../hooks";
import type { CalendarEvent, CalendarEventStatus } from "../types";
import { eventContextPath, eventTypeLabel, formatEventTime, sourceLabels, statusLabels } from "../utils";

// Upcoming events start and finish on their own at the scheduled times.
const doneMessages: Partial<Record<CalendarEventStatus, string>> = {
  upcoming: "Event confirmed",
  completed: "Marked as done",
  cancelled: "Event cancelled",
};

export function EventDetailDialog({ event, timeZone, onClose }: { event: CalendarEvent; timeZone: string; onClose: () => void }) {
  const update = useUpdateCalendarEventStatus();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const manual = (event.sourceType ?? "manual") === "manual";
  const open = !["completed", "cancelled"].includes(event.status);
  const context = eventContextPath(event);
  const reminder = event.reminders?.find((item) => !item.sentAt);

  const move = (status: CalendarEventStatus) =>
    update.mutate(
      { id: event.id, status },
      {
        onSuccess: () => {
          toast.success(doneMessages[status] ?? "Event updated");
          onClose();
        },
        onError: (error) => toast.error("That didn't go through", getApiErrorMessage(error, "Try again in a moment.")),
      },
    );

  const details: Array<[IconName, string, string]> = [
    ["calendar", "When", formatEventTime(event, timeZone)],
    ["clock", "Status", statusLabels[event.status] ?? event.status],
    ...(event.game ? [["games", "Game", event.game] as [IconName, string, string]] : []),
    ...(event.team ? [["team", "Team", event.team] as [IconName, string, string]] : []),
    ...(event.location ? [["mapPin", "Where", event.location] as [IconName, string, string]] : []),
    ...(reminder
      ? [["bell", "Reminder", new Date(reminder.time).toLocaleString(undefined, { timeZone, weekday: "short", hour: "numeric", minute: "2-digit" })] as [IconName, string, string]]
      : []),
  ];

  return (
    <>
      <Dialog
        open
        title={event.title}
        description={`${sourceLabels[event.sourceType ?? "manual"]} · ${eventTypeLabel(event.type)}`}
        icon={event.sourceType === "challenge" ? "challenges" : event.sourceType === "tournament" ? "trophy" : "calendar"}
        dismissible={!update.isPending}
        onClose={onClose}
        footer={
          manual && open ? (
            <>
              <Button tone="ghost" size="sm" disabled={update.isPending} onClick={() => setConfirmCancel(true)}>
                Cancel event
              </Button>
              {event.status === "pending" && (
                <Button size="sm" icon="check" disabled={update.isPending} onClick={() => move("upcoming")}>
                  Confirm
                </Button>
              )}
              {event.status === "ongoing" && (
                <Button size="sm" icon="check" disabled={update.isPending} onClick={() => move("completed")}>
                  Mark done
                </Button>
              )}
              {event.status === "upcoming" && (
                <Button tone="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </>
          ) : context ? (
            <LinkButton to={context} size="sm" icon="arrowRight">
              Open {event.sourceType}
            </LinkButton>
          ) : (
            <Button tone="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )
        }
      >
        <div className="grid gap-5">
          {event.description && <p className="whitespace-pre-line text-sm leading-relaxed text-mist-300">{event.description}</p>}
          <dl className="grid gap-3">
            {details.map(([icon, label, value]) => (
              <div key={label} className="flex items-start gap-3">
                <Icon name={icon} className="mt-0.5 size-4 shrink-0 text-mist-500" />
                <dt className="sr-only">{label}</dt>
                <dd className="text-sm text-mist-100">{value}</dd>
              </div>
            ))}
          </dl>
          {!manual && <p className="text-xs text-mist-500">Its time and status follow the {event.sourceType}, so change them there.</p>}
        </div>
      </Dialog>
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this event?"
        description="It stays on your calendar as cancelled, and its reminder won't be sent."
        confirmLabel="Cancel event"
        cancelLabel="Keep it"
        pending={update.isPending}
        onConfirm={() => move("cancelled")}
        onClose={() => setConfirmCancel(false)}
      />
    </>
  );
}
