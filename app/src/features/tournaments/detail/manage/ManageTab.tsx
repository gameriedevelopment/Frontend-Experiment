import { useMemo, useState, type ReactNode } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSearchResults } from "@/features/discovery/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import {
  cancelTournament,
  decideStart,
  pauseTournament,
  regenerateBracket,
  resumeTournament,
  sendAnnouncement,
  transferOwnership,
} from "../../api";
import { useActivityLog, useManageOverview, useTournamentAction } from "../../hooks";
import type { ActivityEntry, HostedTournamentDetail } from "../../types";
import { durationLabel, formatShortDateTime } from "../../utils";
import type { TournamentTab } from "../TournamentPage";
import { ManageParticipants } from "./ManageParticipants";
import { ReasonDialog } from "./ReasonDialog";
import { SeedingPanel } from "./SeedingPanel";

type Section = "overview" | "participants" | "seeding" | "announce" | "activity" | "settings";
const sections: Array<{ value: Section; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "participants", label: "Entrants" },
  { value: "seeding", label: "Seeding" },
  { value: "announce", label: "Announce" },
  { value: "activity", label: "Activity" },
  { value: "settings", label: "Settings" },
];

const actions: Record<string, string> = {
  "tournament.draft_created": "Created the draft",
  "tournament.settings_updated": "Updated settings",
  "tournament.banner_updated": "Changed the banner",
  "tournament.published": "Published the tournament",
  "tournament.check_in_opened": "Check-in opened",
  "tournament.check_in_closed": "Check-in closed",
  "tournament.started": "Drew the bracket and started",
  "tournament.delayed": "Delayed the start",
  "tournament.paused": "Paused the tournament",
  "tournament.resumed": "Resumed the tournament",
  "tournament.cancelled": "Cancelled the tournament",
  "tournament.completed": "Tournament completed",
  "tournament.removed": "Removed by Gamerie",
  "tournament.announcement": "Sent an announcement",
  "tournament.ownership_transferred": "Transferred ownership",
  "bracket.regenerated": "Redrew the bracket",
  "seeding.updated": "Changed the seeding",
  "entrant.registered": "Registered",
  "entrant.withdrew": "Withdrew",
  "entrant.checked_in": "Checked in",
  "entrant.roster_updated": "Updated a roster",
  "entrant.invited": "Sent an invitation",
  "entrant.invite_accepted": "Accepted an invitation",
  "entrant.invite_declined": "Declined an invitation",
  "entrant.approve": "Approved an entry",
  "entrant.decline": "Declined an entry",
  "entrant.remove": "Removed an entrant",
  "entrant.promote": "Gave a waitlisted entrant a place",
  "entrant.disqualified": "Disqualified an entrant",
  "match.resolved": "A result became final",
  "match.score_declared": "Declared a score",
  "match.time_agreed": "Agreed a match time",
  "match.time_set": "Set a match time",
  "match.rescheduled": "Rescheduled a match",
  "match.reported": "Reported a result",
  "match.needs_time": "A match needs a time",
  "match.escalated": "Sent to Gamerie admins",
  "report.confirm": "Gamerie confirmed a result",
  "report.correct": "Gamerie corrected a result",
  "report.replay": "Gamerie ordered a replay",
};
const roles: Record<ActivityEntry["actorRole"], string> = {
  owner: "Organizer",
  admin: "Gamerie",
  participant: "Entrant",
  system: "Automatic",
};

function Card({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6", className)}>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm leading-relaxed text-mist-400">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Todo({ icon, tone = "brand", title, detail, action }: { icon: IconName; tone?: "brand" | "danger"; title: string; detail: string; action: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/3 px-4 py-3 ring-1 ring-inset ring-white/6">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          tone === "danger" ? "bg-danger/12 text-danger" : "bg-lavender-400/12 text-lavender-300",
        )}
      >
        <Icon name={icon} weight="duotone" className="size-[1.1rem]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-mist-400">{detail}</span>
      </span>
      {action}
    </li>
  );
}

function Overview({
  tournament,
  onSection,
  onTab,
}: {
  tournament: HostedTournamentDetail;
  onSection: (section: Section) => void;
  onTab: (tab: TournamentTab, match?: string) => void;
}) {
  const id = tournament.id;
  const query = useManageOverview(id, true);
  const [dialog, setDialog] = useState<null | "start" | "delay" | "cancel" | "regenerate">(null);
  const [delayTo, setDelayTo] = useState("");
  const pause = useTournamentAction(id, () => pauseTournament(id));
  const resume = useTournamentAction(id, () => resumeTournament(id));
  const regenerate = useTournamentAction(id, () => regenerateBracket(id));
  const cancel = useTournamentAction(id, (reason: string) => cancelTournament(id, reason));
  const start = useTournamentAction(id, (payload: Parameters<typeof decideStart>[1]) => decideStart(id, payload));
  const closed = ["completed", "cancelled"].includes(tournament.phase);

  if (query.isLoading) return <Skeleton className="h-80 rounded-card" />;
  if (query.isError || !query.data) {
    return (
      <p role="alert" className="text-sm text-danger">
        {getApiErrorMessage(query.error, "The organizer tools didn't load.")}
      </p>
    );
  }
  const data = query.data;
  const openReports = data.reports.filter((report) => report.status === "pending");
  const stats: Array<[string, number, boolean?]> = [
    ["Registered", data.counts.registered],
    ["Checked in", data.counts.checkedIn],
    ["Waitlist", data.counts.waitlisted],
    ["To approve", data.counts.pending, data.counts.pending > 0],
    ["Live matches", data.matches.live],
    ["Awaiting result", data.matches.awaitingResult],
    ["Scheduled", data.matches.scheduled],
    ["Open reports", openReports.length, openReports.length > 0],
  ];

  return (
    <div className="grid gap-6">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card bg-white/6 ring-1 ring-inset ring-white/6 sm:grid-cols-4">
        {stats.map(([label, value, alert]) => (
          <div key={label} className="bg-ink-900 px-4 py-4">
            <dt className="type-label text-mist-500">{label}</dt>
            <dd className={cn("type-display mt-2 text-2xl tabular-nums leading-none", alert ? "text-lavender-300" : "text-mist-50")}>{value}</dd>
          </div>
        ))}
      </dl>

      {(tournament.phase === "awaiting_start" || data.counts.pending > 0 || data.needsTime.length > 0 || openReports.length > 0) && (
        <Card title="Needs your attention">
          <ul className="grid gap-2">
            {tournament.phase === "awaiting_start" && (
              <Todo
                icon="hourglass"
                title="Below the minimum to start"
                detail={`${data.counts.checkedIn} checked in; you asked for at least ${tournament.minEntrants}.`}
                action={
                  <span className="flex flex-wrap gap-1.5">
                    <Button size="sm" icon="play" disabled={!data.canStart} onClick={() => setDialog("start")}>
                      Start anyway
                    </Button>
                    <Button tone="outline" size="sm" onClick={() => setDialog("delay")}>
                      Delay
                    </Button>
                  </span>
                }
              />
            )}
            {data.counts.pending > 0 && (
              <Todo
                icon="ticket"
                title={`${data.counts.pending} ${data.counts.pending === 1 ? "entry" : "entries"} to approve`}
                detail="They're waiting to hear if they're in."
                action={
                  <Button tone="outline" size="sm" onClick={() => onSection("participants")}>
                    Review
                  </Button>
                }
              />
            )}
            {data.needsTime.map((match) => (
              <Todo
                key={match.id}
                icon="clock"
                tone={match.overdue ? "danger" : "brand"}
                title={`Match #${match.number} has no time`}
                detail={match.overdue ? "The round deadline has passed." : match.deadlineAt ? `Play by ${formatShortDateTime(match.deadlineAt)}` : "Opponents haven't agreed a time."}
                action={
                  <Button tone="outline" size="sm" onClick={() => onTab("matches", match.id)}>
                    Set time
                  </Button>
                }
              />
            ))}
            {openReports.map((report) => (
              <Todo
                key={report.id}
                icon="flag"
                tone="danger"
                title="Result reported"
                detail={`${report.reason}${report.waitingMs ? ` · waiting ${durationLabel(report.waitingMs)}` : ""}. A Gamerie admin decides.`}
                action={
                  report.matchId ? (
                    <Button tone="ghost" size="sm" onClick={() => onTab("matches", report.matchId!)}>
                      View match
                    </Button>
                  ) : null
                }
              />
            ))}
          </ul>
        </Card>
      )}

      {!closed && (
        <Card title="Controls" description="Each action is confirmed, shared with entrants where it affects them, and recorded in the activity log.">
          <div className="flex flex-wrap gap-2">
            {tournament.phase === "live" && (
              <Button tone="outline" size="sm" icon="pause" disabled={pause.isPending} onClick={() => pause.mutate(undefined, { onSuccess: () => toast.info("Tournament paused", "Match timers are on hold.") })}>
                Pause
              </Button>
            )}
            {tournament.phase === "paused" && (
              <Button size="sm" icon="play" disabled={resume.isPending} onClick={() => resume.mutate(undefined, { onSuccess: () => toast.success("Tournament resumed") })}>
                Resume
              </Button>
            )}
            {["live", "awaiting_start"].includes(tournament.phase) && (
              <Button tone="outline" size="sm" icon="refresh" onClick={() => setDialog("regenerate")}>
                Redraw bracket
              </Button>
            )}
            <LinkButton to={`/tournaments/${id}/edit`} tone="outline" size="sm" icon="edit">
              Edit details
            </LinkButton>
            <Button tone="ghost" size="sm" icon="prohibit" className="text-danger" onClick={() => setDialog("cancel")}>
              Cancel tournament
            </Button>
          </div>
          {(pause.isError || resume.isError) && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {getApiErrorMessage(pause.error ?? resume.error, "That didn't go through.")}
            </p>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={dialog === "start"}
        title="Start with fewer entrants?"
        description={`The bracket is drawn now with the ${data.counts.checkedIn} who checked in. Top seeds get byes.`}
        confirmLabel="Start now"
        icon="play"
        pending={start.isPending}
        error={start.isError ? getApiErrorMessage(start.error, "It couldn't start.") : undefined}
        onConfirm={() => start.mutate({ decision: "start" }, { onSuccess: () => { setDialog(null); toast.success("Bracket drawn", "The tournament is live."); } })}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "regenerate"}
        title="Redraw the bracket?"
        description="Every match is generated again from the current seeding. Results already played are lost."
        confirmLabel="Redraw"
        icon="refresh"
        pending={regenerate.isPending}
        error={regenerate.isError ? getApiErrorMessage(regenerate.error, "It couldn't be redrawn.") : undefined}
        onConfirm={() => regenerate.mutate(undefined, { onSuccess: () => { setDialog(null); toast.success("Bracket redrawn"); } })}
        onClose={() => setDialog(null)}
      />
      {dialog === "delay" && (
        <Dialog
          open
          title="Delay the start"
          description="Everyone entered is told the new time. Check-in opens again before it."
          icon="clock"
          size="lg"
          onClose={() => setDialog(null)}
          dismissible={!start.isPending}
          footer={
            <>
              <Button tone="ghost" size="sm" onClick={() => setDialog(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!delayTo || start.isPending}
                onClick={() =>
                  start.mutate({ decision: "delay", startsAt: delayTo }, { onSuccess: () => { setDialog(null); toast.success("Start delayed", formatShortDateTime(delayTo)); } })
                }
              >
                {start.isPending ? "Saving…" : "Delay start"}
              </Button>
            </>
          }
        >
          <ScheduleField label="New start" days={30} value={delayTo} onChange={setDelayTo} error={start.isError ? getApiErrorMessage(start.error, "It couldn't be delayed.") : undefined} />
        </Dialog>
      )}
      {dialog === "cancel" && (
        <ReasonDialog
          title="Cancel this tournament?"
          description="Everyone entered is told. Finished results stay on players' records. This can't be undone."
          confirmLabel="Cancel tournament"
          icon="prohibit"
          pending={cancel.isPending}
          error={cancel.isError ? getApiErrorMessage(cancel.error, "It couldn't be cancelled.") : undefined}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => cancel.mutate(reason, { onSuccess: () => { setDialog(null); toast.info("Tournament cancelled"); } })}
        />
      )}
    </div>
  );
}

function Announce({ tournament }: { tournament: HostedTournamentDetail }) {
  const [audience, setAudience] = useState<"all" | "remaining">("all");
  const [message, setMessage] = useState("");
  const announce = useTournamentAction(tournament.id, () => sendAnnouncement(tournament.id, audience, message.trim()));
  return (
    <Card title="Send an announcement" description="It arrives as a notification. Use it for schedule changes, lobby details or reminders.">
      <div className="grid gap-5">
        <Segmented
          label="Send to"
          value={audience}
          onChange={setAudience}
          options={[
            { value: "all", label: "Everyone entered" },
            { value: "remaining", label: "Only those still in" },
          ]}
          className="w-fit"
        />
        <TextAreaField
          id="announcement"
          label="Message"
          maxLength={1000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Quarterfinals start at 8 PM. Lobby codes go out 10 minutes before."
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            icon="megaphone"
            disabled={message.trim().length < 3 || announce.isPending || tournament.phase === "cancelled"}
            onClick={() => announce.mutate(undefined, { onSuccess: () => { setMessage(""); toast.success("Announcement sent"); } })}
          >
            {announce.isPending ? "Sending…" : "Send"}
          </Button>
        </div>
        {announce.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(announce.error, "The announcement wasn't sent.")}
          </p>
        )}
      </div>
    </Card>
  );
}

function Activity({ tournament }: { tournament: HostedTournamentDetail }) {
  const [page, setPage] = useState(1);
  const query = useActivityLog(tournament.id, page, true);
  const entries = query.data?.data ?? [];
  const pages = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.limit)) : 1;
  if (query.isLoading) return <Skeleton className="h-80 rounded-card" />;
  return (
    <Card title="Activity" description="Everything the organizer, entrants and Gamerie did, newest first.">
      {entries.length ? (
        <ol className="grid">
          {entries.map((entry) => (
            <li key={entry.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-t border-white/6 py-3 first:border-t-0 first:pt-0">
              <span className="min-w-0">
                <span className="block text-sm">{actions[entry.action] ?? entry.action}</span>
                <span className="block text-xs text-mist-500">{roles[entry.actorRole]}</span>
              </span>
              <time dateTime={entry.createdAt} className="text-xs tabular-nums text-mist-500">
                {formatShortDateTime(entry.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-mist-400">Nothing yet.</p>
      )}
      {pages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <Button tone="ghost" size="sm" icon="arrowLeft" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Newer
          </Button>
          <span className="text-xs text-mist-500">
            Page {page} of {pages}
          </span>
          <Button tone="ghost" size="sm" icon="arrowRight" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Older
          </Button>
        </div>
      )}
    </Card>
  );
}

function Settings({ tournament }: { tournament: HostedTournamentDetail }) {
  const [query, setQuery] = useState("");
  const [person, setPerson] = useState<ComboboxOption | null>(null);
  const [confirming, setConfirming] = useState(false);
  const term = useDebouncedValue(query);
  const players = useSearchResults("players", term);
  const transfer = useTournamentAction(tournament.id, (userId: string) => transferOwnership(tournament.id, userId));
  const options = useMemo<ComboboxOption[]>(
    () => (players.data?.data ?? []).map((player) => ({ value: player.id, label: player.username, description: player.gamerTitle, image: player.profileImage })),
    [players.data],
  );
  return (
    <div className="grid gap-6">
      <Card title="Details" description="Name, description, banner, rules and schedule. What can still change depends on how far along the tournament is.">
        <LinkButton to={`/tournaments/${tournament.id}/edit`} tone="outline" size="sm" icon="edit">
          Edit details
        </LinkButton>
      </Card>
      <Card title="Transfer ownership" description="Hand the tournament to another player. You lose organizer access once they're the owner.">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <Combobox
            id="transfer-to"
            label="New owner"
            placeholder="Search players"
            query={query}
            onQueryChange={setQuery}
            options={options}
            loading={players.isFetching}
            value={person}
            onChange={setPerson}
            avatars
          />
          <Button tone="outline" size="sm" icon="transfer" className="h-12" disabled={!person} onClick={() => setConfirming(true)}>
            Transfer
          </Button>
        </div>
      </Card>
      <ConfirmDialog
        open={confirming}
        title={`Make ${person?.label} the owner?`}
        description="They get full organizer control and you lose it. This can't be undone from your side."
        confirmLabel="Transfer"
        icon="transfer"
        pending={transfer.isPending}
        error={transfer.isError ? getApiErrorMessage(transfer.error, "Ownership couldn't be transferred.") : undefined}
        onConfirm={() => person && transfer.mutate(person.value, { onSuccess: () => { setConfirming(false); toast.success("Ownership transferred", person.label); } })}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}

export function ManageTab({ tournament, onTab }: { tournament: HostedTournamentDetail; onTab: (tab: TournamentTab, match?: string) => void }) {
  const [section, setSection] = useState<Section>("overview");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Segmented label="Organizer tools" options={sections} value={section} onChange={setSection} className="relative w-fit max-w-full overflow-x-auto scrollbar-none" />
      {section === "overview" ? (
        <Overview tournament={tournament} onSection={setSection} onTab={onTab} />
      ) : section === "participants" ? (
        <ManageParticipants tournament={tournament} />
      ) : section === "seeding" ? (
        <SeedingPanel tournament={tournament} />
      ) : section === "announce" ? (
        <Announce tournament={tournament} />
      ) : section === "activity" ? (
        <Activity tournament={tournament} />
      ) : (
        <Settings tournament={tournament} />
      )}
    </div>
  );
}
