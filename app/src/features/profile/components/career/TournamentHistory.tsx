import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DateField } from "@/components/ui/DateField";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { OptionCards } from "@/components/ui/OptionCards";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useUpdatePlayerProfile } from "../../hooks";
import type { PlayerProfile, ProfileTournament } from "../../types";
import { ProfileSection } from "../ProfileSection";

type Draft = {
  name: string;
  game: string;
  date: string;
  status: "upcoming" | "completed";
  placement: string;
  totalParticipants: string;
  prizePool: string;
  organizer: string;
  url: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyDraft = (): Draft => ({
  name: "",
  game: "",
  date: today(),
  status: "completed",
  placement: "",
  totalParticipants: "",
  prizePool: "",
  organizer: "",
  url: "",
});

/** Placements written by Gamerie when a hosted tournament finishes; they can't be edited. */
const isVerified = (item: ProfileTournament) => item.tournament?.source === "hosted" || item.tournament?.source === "official";
const nameOf = (item: ProfileTournament) => item.name || item.tournament?.name || item.title || "Tournament";
const gameOf = (item: ProfileTournament) =>
  typeof item.game === "string" ? item.game : item.game?.name || item.tournament?.game || "";
const dateOf = (item: ProfileTournament) => {
  const date = new Date(item.date || "");
  return Number.isNaN(date.getTime()) ? null : date;
};
const ordinal = (value: number) => {
  const rest = value % 100;
  if (rest >= 11 && rest <= 13) return `${value}th`;
  return `${value}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] ?? "th"}`;
};

function Placement({ value }: { value?: number | null }) {
  if (!value) return <span className="type-label text-mist-500">Played</span>;
  return (
    <span
      className={cn(
        "type-display flex h-9 min-w-12 items-center justify-center gap-1 rounded-xl px-2.5 text-sm",
        value === 1 ? "bg-signal/12 text-signal" : value <= 3 ? "bg-lavender-400/12 text-lavender-200" : "bg-white/5 text-mist-300",
      )}
    >
      {value === 1 && <Icon name="crown" weight="fill" className="size-3.5" />}
      {ordinal(value)}
    </span>
  );
}

export function TournamentHistory({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const update = useUpdatePlayerProfile(profile.id);
  const tournaments = useMemo(() => profile.tournaments ?? [], [profile.tournaments]);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [invalid, setInvalid] = useState("");

  const sorted = useMemo(
    () =>
      tournaments
        .map((item, index) => ({ item, index }))
        .sort((a, b) => (dateOf(b.item)?.getTime() ?? 0) - (dateOf(a.item)?.getTime() ?? 0)),
    [tournaments],
  );
  const visible = expanded ? sorted : sorted.slice(0, 5);
  const wins = tournaments.filter((item) => item.placement === 1).length;
  const podiums = tournaments.filter((item) => item.placement && item.placement <= 3).length;
  const myGames = [...new Set((profile.gamesPlayed ?? profile.games ?? []).map((game) => game.name).filter(Boolean))] as string[];

  // Mirrors the revamp: every entry is normalised, and only self-reported ones are sent back.
  const normalized = tournaments.map((item) => ({
    id: item.id,
    name: nameOf(item),
    game: gameOf(item) || "Other",
    date: item.date || today(),
    status: item.status || "completed",
    placement: item.placement ?? undefined,
    totalParticipants: item.totalParticipants || 1,
    prizePool: item.prizePool == null ? undefined : String(item.prizePool),
    organizer: item.organizer || item.tournament?.organizer || "Not shared",
    url: item.url || undefined,
  }));
  const selfReported = <T,>(items: T[]) => items.filter((_, index) => index >= tournaments.length || !isVerified(tournaments[index]));

  const begin = (value: number | "new") => {
    setInvalid("");
    setEditing(value);
    if (value === "new") return setDraft(emptyDraft());
    const item = tournaments[value];
    setDraft({
      name: nameOf(item),
      game: gameOf(item),
      date: item.date?.slice(0, 10) || today(),
      status: item.status || ((dateOf(item)?.getTime() ?? 0) > Date.now() ? "upcoming" : "completed"),
      placement: item.placement == null ? "" : String(item.placement),
      totalParticipants: item.totalParticipants == null ? "" : String(item.totalParticipants),
      prizePool: item.prizePool == null ? "" : String(item.prizePool),
      organizer: item.organizer || item.tournament?.organizer || "",
      url: item.url || "",
    });
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.game.trim() || !draft.date || !draft.organizer.trim()) {
      return setInvalid("Add the name, game, date and organizer.");
    }
    if (draft.url && !/^https?:\/\//i.test(draft.url.trim())) return setInvalid("Links start with https://");
    const next = {
      id: typeof editing === "number" ? normalized[editing].id : undefined,
      name: draft.name.trim(),
      game: draft.game.trim(),
      date: draft.date,
      status: draft.status,
      placement: draft.placement ? Number(draft.placement) : undefined,
      totalParticipants: draft.totalParticipants ? Number(draft.totalParticipants) : 1,
      prizePool: draft.prizePool.trim() || undefined,
      organizer: draft.organizer.trim(),
      url: draft.url.trim() || undefined,
    };
    const items = [...normalized];
    if (typeof editing === "number") items.splice(editing, 1, next);
    else items.push(next);
    try {
      await update.mutateAsync({ tournaments: selfReported(items) as ProfileTournament[] });
      toast.success(editing === "new" ? "Tournament added" : "Tournament updated");
      setEditing(null);
    } catch {
      // Shown in the dialog.
    }
  };

  const remove = (index: number) =>
    update.mutate(
      { tournaments: selfReported(normalized).filter((item) => item !== normalized[index]) as ProfileTournament[] },
      {
        onSuccess: () => {
          setRemoving(null);
          toast.info("Tournament removed");
        },
      },
    );

  return (
    <ProfileSection
      id="tournament-history"
      title="Tournament history"
      meta={
        own ? (
          <Button tone="ghost" size="sm" icon="plus" className="-mr-3" onClick={() => begin("new")}>
            Add
          </Button>
        ) : tournaments.length ? (
          `${tournaments.length} played`
        ) : undefined
      }
    >
      {tournaments.length > 0 && (
        <dl className="mb-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/6 ring-1 ring-inset ring-white/6">
          {[
            ["Played", tournaments.length],
            ["Podiums", podiums],
            ["Wins", wins],
          ].map(([label, value]) => (
            <div key={label} className="bg-ink-900 px-4 py-3">
              <dt className="type-label text-mist-500">{label}</dt>
              <dd className={cn("type-display mt-1 text-xl tabular-nums", label === "Wins" && Number(value) > 0 && "text-signal")}>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {visible.length ? (
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-1">
          {visible.map(({ item, index }) => {
            const verified = isVerified(item);
            const date = dateOf(item);
            const prize = item.prizePool ?? item.tournament?.prizePool;
            const title = <span className="block truncate text-sm font-semibold">{nameOf(item)}</span>;
            return (
              <li key={item.id ?? `${nameOf(item)}-${index}`} className="flex items-center gap-4 rounded-2xl px-2 py-2.5 hover:bg-white/3">
                <span className="grid w-12 shrink-0 justify-items-center text-center">
                  <span className="type-label text-mist-500">{date ? new Intl.DateTimeFormat(undefined, { month: "short" }).format(date) : "—"}</span>
                  <span className="text-xs tabular-nums text-mist-400">{date?.getFullYear()}</span>
                </span>
                <span className="min-w-0 flex-1">
                  {verified && item.tournament?.id ? (
                    <Link to={`/tournaments/${item.tournament.id}`} className="hover:text-lavender-200">
                      {title}
                    </Link>
                  ) : item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-lavender-200">
                      {title}
                    </a>
                  ) : (
                    title
                  )}
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-mist-500">
                    {[gameOf(item), item.organizer || item.tournament?.organizer, prize ? `${prize} prize pool` : null].filter(Boolean).join(" · ")}
                    {verified && (
                      <span className="flex items-center gap-1 font-medium text-signal">
                        <Icon name="verified" weight="fill" className="size-3.5" />
                        Verified by Gamerie
                      </span>
                    )}
                    {item.status === "upcoming" && <span className="text-lavender-300">Upcoming</span>}
                  </span>
                </span>
                <Placement value={item.placement} />
                {own && !verified && (
                  <Menu
                    label={`Options for ${nameOf(item)}`}
                    items={[
                      { label: "Edit", icon: "edit", onSelect: () => begin(index) },
                      { label: "Remove", icon: "trash", danger: true, onSelect: () => setRemoving(index) },
                    ]}
                  />
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm leading-relaxed text-mist-400">
          {own
            ? "Tournaments you play on Gamerie appear here automatically and verified. Add ones you've played elsewhere, too."
            : "No tournaments yet."}
        </p>
      )}
      {sorted.length > 5 && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-4 text-sm font-medium text-lavender-300 hover:text-lavender-200">
          {expanded ? "Show fewer" : `Show all ${sorted.length}`}
        </button>
      )}

      {editing !== null && (
        <Dialog
          open
          title={editing === "new" ? "Add a tournament" : "Edit tournament"}
          description="Self-reported results show without the verified mark. Tournaments run on Gamerie are added for you."
          icon="trophy"
          size="lg"
          onClose={() => setEditing(null)}
          dismissible={!update.isPending}
          footer={
            <>
              <Button tone="ghost" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={update.isPending} onClick={() => void save()}>
                {update.isPending ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <div className="grid gap-5">
            <TextField id="t-name" label="Tournament" maxLength={100} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <div className="grid gap-2">
              <TextField id="t-game" label="Game" maxLength={60} value={draft.game} onChange={(event) => setDraft({ ...draft, game: event.target.value })} />
              {myGames.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {myGames.map((game) => (
                    <button
                      key={game}
                      type="button"
                      onClick={() => setDraft({ ...draft, game })}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
                        draft.game === game ? "bg-lavender-400/12 text-mist-50 ring-lavender-400/60" : "text-mist-300 ring-white/12 hover:text-mist-50",
                      )}
                    >
                      {game}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <DateField id="t-date" label="Date" value={draft.date} onChange={(date) => setDraft({ ...draft, date })} />
              <TextField id="t-organizer" label="Organizer" maxLength={80} value={draft.organizer} onChange={(event) => setDraft({ ...draft, organizer: event.target.value })} />
            </div>
            <OptionCards
              legend="Status"
              value={draft.status}
              onChange={(status) => setDraft({ ...draft, status })}
              options={[
                { value: "completed", label: "Played", description: "It's finished" },
                { value: "upcoming", label: "Upcoming", description: "You're entered" },
              ]}
            />
            <div className="grid grid-cols-3 gap-3">
              <TextField id="t-place" label="Place" inputMode="numeric" placeholder="1" value={draft.placement} onChange={(event) => setDraft({ ...draft, placement: event.target.value.replace(/\D/g, "") })} />
              <TextField id="t-size" label="Entrants" inputMode="numeric" placeholder="32" value={draft.totalParticipants} onChange={(event) => setDraft({ ...draft, totalParticipants: event.target.value.replace(/\D/g, "") })} />
              <TextField id="t-prize" label="Prize pool" placeholder="$500" value={draft.prizePool} onChange={(event) => setDraft({ ...draft, prizePool: event.target.value })} />
            </div>
            <TextField id="t-url" label="Link (optional)" type="url" placeholder="https://" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} />
            {(invalid || update.isError) && (
              <p role="alert" className="text-sm text-danger">
                {invalid || getApiErrorMessage(update.error, "It couldn't be saved.")}
              </p>
            )}
          </div>
        </Dialog>
      )}
      <ConfirmDialog
        open={removing !== null}
        title="Remove this tournament?"
        description="It's taken off your career history."
        confirmLabel="Remove"
        pending={update.isPending}
        onConfirm={() => removing !== null && remove(removing)}
        onClose={() => setRemoving(null)}
      />
    </ProfileSection>
  );
}
