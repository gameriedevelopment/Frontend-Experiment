import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { inputClasses, TextAreaField, TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Segmented } from "@/components/ui/Segmented";
import { TimeZoneField } from "@/components/ui/TimeZoneField";
import { useAuthStore } from "@/features/auth/authStore";
import { useUserTeams } from "@/features/communities/hooks";
import { useGameOptions } from "@/features/games/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useCreateCalendarEvent } from "../hooks";
import type { CreateCalendarEventPayload } from "../types";
import { zonedDateTimeToIso } from "../utils";

type EventType = CreateCalendarEventPayload["type"];

const types: Array<{ value: EventType; label: string }> = [
  { value: "match", label: "Match" },
  { value: "practice", label: "Practice" },
  { value: "team_meeting", label: "Team meeting" },
  { value: "personal", label: "Personal" },
];
const lengths = [
  { value: "30", label: "30 min" },
  { value: "60", label: "1 hr" },
  { value: "120", label: "2 hr" },
  { value: "180", label: "3 hr" },
];
const reminders = [
  { value: "0", label: "None" },
  { value: "15", label: "15 min" },
  { value: "60", label: "1 hr" },
  { value: "1440", label: "1 day" },
];

/** The wall-clock "YYYY-MM-DDTHH:mm" for an instant in a time zone, for datetime-local inputs. */
function wallTime(date: Date, timeZone: string) {
  const part = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(date)
      .map((item) => [item.type, item.value]),
  );
  return `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}`;
}

/** Next half hour, or the given day at the next sensible slot. */
function initialStart(timeZone: string, day?: string) {
  const now = new Date();
  now.setMinutes(now.getMinutes() < 30 ? 30 : 60, 0, 0);
  const next = wallTime(now, timeZone);
  if (!day || day <= next.slice(0, 10)) return next;
  return `${day}T18:00`;
}

export function EventComposer({ defaultTimeZone, day, onClose }: { defaultTimeZone: string; day?: string; onClose: () => void }) {
  const user = useAuthStore((state) => state.user);
  const create = useCreateCalendarEvent();
  const teams = useUserTeams(user?.id);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("match");
  const [timeZone, setTimeZone] = useState(defaultTimeZone);
  const [start, setStart] = useState(() => initialStart(defaultTimeZone, day));
  const [length, setLength] = useState("60");
  const [game, setGame] = useState("");
  const [gameQuery, setGameQuery] = useState("");
  const [team, setTeam] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState("15");
  const [errors, setErrors] = useState<{ title?: string; schedule?: string; form?: string }>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = Boolean(title.trim() || notes.trim() || location.trim() || game || team);
  const requestClose = () => (dirty ? setConfirmDiscard(true) : onClose());
  const games = useGameOptions(useDebouncedValue(gameQuery.trim()));
  const gameOptions = useMemo(() => (games.data?.data ?? []).slice(0, gameQuery.trim() ? 20 : 10).map((item) => ({ value: item.name, label: item.name, description: item.gameType })), [games.data, gameQuery]);
  const teamNames = useMemo(() => [...new Set((teams.data ?? []).map((item) => item.name).filter(Boolean))], [teams.data]);
  const teamOptions = useMemo(() => teamNames.filter((name) => name.toLowerCase().includes(teamQuery.trim().toLowerCase())).map((name) => ({ value: name, label: name })), [teamNames, teamQuery]);

  const schedule = useMemo(() => {
    try {
      const startIso = zonedDateTimeToIso(start, timeZone);
      const endIso = new Date(new Date(startIso).getTime() + Number(length) * 60_000).toISOString();
      return { startIso, endIso };
    } catch {
      return null;
    }
  }, [length, start, timeZone]);
  const endLabel = schedule ? new Intl.DateTimeFormat(undefined, { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(schedule.endIso)) : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Give it a title.";
    if (!schedule) next.schedule = "That time doesn't exist in this time zone. Pick another.";
    else if (new Date(schedule.startIso) <= new Date()) next.schedule = "Pick a time in the future.";
    setErrors(next);
    if (next.title || next.schedule || !schedule) return;
    const minutes = Number(reminder);
    try {
      await create.mutateAsync({
        type,
        title: title.trim(),
        description: notes.trim() || undefined,
        startTime: schedule.startIso,
        endTime: schedule.endIso,
        game: game || undefined,
        team: team || undefined,
        location: location.trim() || undefined,
        status: "upcoming",
        reminders: minutes ? [{ time: new Date(new Date(schedule.startIso).getTime() - minutes * 60_000).toISOString(), method: "notification" }] : undefined,
      });
      toast.success("Added to your calendar");
      onClose();
    } catch (reason) {
      setErrors({ form: getApiErrorMessage(reason, "The event wasn't saved. Try again.") });
    }
  };

  return (
    <>
      <Dialog
        open
        title="Add an event"
        description="Plan practice, a match or anything else. Challenges and tournaments add themselves."
        icon="calendar"
        size="lg"
        dismissible={!create.isPending}
        onClose={requestClose}
        footer={
          <>
            <Button tone="ghost" size="sm" disabled={create.isPending} onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" form="event-composer" size="sm" icon="check" disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add event"}
            </Button>
          </>
        }
      >
        <form id="event-composer" onSubmit={submit} className="grid gap-5" noValidate>
          <TextField id="event-title" label="Title" autoFocus maxLength={255} value={title} error={errors.title} onChange={(event) => setTitle(event.target.value)} placeholder="Scrims with Denver Drift" />
          <div className="grid gap-2">
            <span className="text-sm font-medium text-mist-200">Type</span>
            <Segmented label="Type" options={types} value={type} onChange={setType} className="self-start overflow-x-auto" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-mist-200">Starts</span>
              <input
                type="datetime-local"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                aria-invalid={Boolean(errors.schedule)}
                className={cn(inputClasses, "scheme-dark")}
              />
            </label>
            <div className="grid gap-2">
              <span className="flex items-baseline justify-between text-sm font-medium text-mist-200">
                Length
                {endLabel && <span className="text-xs font-normal text-mist-500">Ends {endLabel}</span>}
              </span>
              <Segmented label="Length" options={lengths} value={length} onChange={setLength} className="self-start" />
            </div>
          </div>
          {errors.schedule && <p className="-mt-2 text-[0.8rem] text-danger">{errors.schedule}</p>}
          <TimeZoneField id="event-timezone" value={timeZone} onChange={(zone) => zone && setTimeZone(zone)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Combobox
              id="event-game"
              label="Game (optional)"
              placeholder="Search games"
              query={gameQuery}
              onQueryChange={setGameQuery}
              options={gameOptions}
              loading={games.isFetching}
              browse
              browseLabel="Popular games"
              value={game ? { value: game, label: game } : null}
              onChange={(option) => setGame(option?.value ?? "")}
            />
            <Combobox
              id="event-team"
              label="Team (optional)"
              placeholder={teamNames.length ? "Search your teams" : "You're not on a team yet"}
              query={teamQuery}
              onQueryChange={setTeamQuery}
              options={teamOptions}
              loading={teams.isLoading}
              emptyText="None of your teams match"
              browse
              browseLabel="Your teams"
              value={team ? { value: team, label: team } : null}
              onChange={(option) => setTeam(option?.value ?? "")}
            />
          </div>
          <TextField id="event-location" label="Where (optional)" maxLength={255} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Discord, a venue, or a server" />
          <TextAreaField id="event-notes" label="Notes (optional)" rows={3} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} />
          <div className="grid gap-2">
            <span className="text-sm font-medium text-mist-200">Remind me</span>
            <Segmented label="Reminder" options={reminders} value={reminder} onChange={setReminder} className="self-start" />
          </div>
          {errors.form && <Notice tone="danger">{errors.form}</Notice>}
        </form>
      </Dialog>
      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this event?"
        description="What you've typed won't be saved."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        pending={false}
        onConfirm={onClose}
        onClose={() => setConfirmDiscard(false)}
      />
    </>
  );
}
