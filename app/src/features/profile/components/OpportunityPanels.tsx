import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGameOptions } from "@/features/games/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { timeAgo } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useMyReferrals, useUpdatePlayerProfile } from "../hooks";
import type { PlayerProfile } from "../types";
import { ProfileSection } from "./ProfileSection";

const needTypes: Array<{ value: string; label: string; icon: IconName }> = [
  { value: "Looking for Team", label: "A team", icon: "team" },
  { value: "Looking for Players", label: "Players", icon: "people" },
  { value: "Looking for Coach", label: "A coach", icon: "identity" },
  { value: "Looking for Practice Partner", label: "Practice partner", icon: "challenges" },
  { value: "Looking for Tournament", label: "Tournaments", icon: "trophy" },
];
const needMeta = (type?: string) => needTypes.find((item) => item.value === type) ?? needTypes[1];

/** What a player is looking for right now: a team, players, a coach, practice or tournaments. */
export function NeedsPanel({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const update = useUpdatePlayerProfile(profile.id);
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const [form, setForm] = useState({ type: needTypes[0].value, game: "", description: "" });
  const [gameQuery, setGameQuery] = useState("");
  const games = useGameOptions(useDebouncedValue(gameQuery), open);
  const gameOptions = useMemo<ComboboxOption[]>(
    () => (games.data?.data ?? []).map((game) => ({ value: game.name, label: game.name, description: game.gameType })),
    [games.data],
  );
  const active = (profile.needs ?? []).map((item, index) => ({ item, index })).filter(({ item }) => item.active !== false);
  const normalized = () =>
    (profile.needs ?? []).map((item) => ({
      type: item.type || "Looking for Players",
      game: item.game || "",
      description: item.description || "",
      active: item.active !== false,
    }));

  if (!own && !active.length) return null;

  return (
    <ProfileSection
      title="Open to"
      meta={
        own ? (
          <Button tone="ghost" size="sm" icon="plus" className="-mr-3" onClick={() => setOpen(true)}>
            Add
          </Button>
        ) : undefined
      }
    >
      {active.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {active.map(({ item, index }) => {
            const meta = needMeta(item.type);
            return (
              <li key={item.id ?? `${item.type}-${index}`} className="flex gap-3 rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/6">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-signal/10 text-signal">
                  <Icon name={meta.icon} weight="duotone" className="size-[1.1rem]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">Looking for {meta.label.toLowerCase()}</span>
                  <span className="mt-0.5 block text-xs text-lavender-300">{item.game || "Any game"}</span>
                  {item.description && <span className="mt-2 block text-sm leading-relaxed text-mist-300">{item.description}</span>}
                </span>
                {own && (
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => setRemoving(index)}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-mist-500 hover:bg-white/6 hover:text-danger"
                  >
                    <Icon name="close" className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-mist-400">Tell people what you're after, like a team for your main game or a practice partner. It shows here and in Discover.</p>
      )}

      {open && (
        <Dialog
          open
          title="What are you looking for?"
          icon="spark"
          size="lg"
          onClose={() => setOpen(false)}
          dismissible={!update.isPending}
          footer={
            <>
              <Button tone="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={update.isPending}
                onClick={() =>
                  update.mutate(
                    { needs: [...normalized(), { ...form, active: true }] },
                    {
                      onSuccess: () => {
                        setOpen(false);
                        setForm({ type: needTypes[0].value, game: "", description: "" });
                        toast.success("Added to your profile");
                      },
                    },
                  )
                }
              >
                {update.isPending ? "Saving…" : "Add"}
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
            <ChoiceGroup legend="Looking for" columns={2}>
              {needTypes.map((item) => (
                <ChoiceChip key={item.value} name="need-type" value={item.value} checked={form.type === item.value} onChange={() => setForm({ ...form, type: item.value })} label={item.label} />
              ))}
            </ChoiceGroup>
            <Combobox
              browse
              browseLabel="Popular games"
              id="need-game"
              label="Game (optional)"
              placeholder="Search games"
              query={gameQuery}
              onQueryChange={setGameQuery}
              options={gameOptions}
              loading={games.isFetching}
              value={form.game ? { value: form.game, label: form.game } : null}
              onChange={(option) => setForm({ ...form, game: option?.value ?? "" })}
            />
            <TextAreaField
              id="need-description"
              label="Details (optional)"
              maxLength={300}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Rank, role, schedule, region…"
            />
            {update.isError && (
              <p role="alert" className="text-sm text-danger">
                {getApiErrorMessage(update.error, "It couldn't be saved.")}
              </p>
            )}
          </div>
        </Dialog>
      )}
      <ConfirmDialog
        open={removing !== null}
        title="Remove this?"
        description="It's taken off your profile and Discover."
        confirmLabel="Remove"
        pending={update.isPending}
        onConfirm={() =>
          update.mutate(
            { needs: normalized().filter((_, index) => index !== removing) },
            {
              onSuccess: () => {
                setRemoving(null);
                toast.info("Removed");
              },
            },
          )
        }
        onClose={() => setRemoving(null)}
      />
    </ProfileSection>
  );
}

/** Your invite link and the players who joined with it. Only shown on your own profile. */
export function ReferralPanel() {
  const query = useMyReferrals(true);
  const first = query.data?.pages[0];
  const code = first?.referralCode?.trim() ?? "";
  const entries = query.data?.pages.flatMap((page) => page.referrals) ?? [];
  const inviteUrl = code ? `${window.location.origin}/register?ref=${encodeURIComponent(code)}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Invite link copied", "Anyone who joins with it shows up here.");
    } catch {
      toast.error("Couldn't copy the link", inviteUrl);
    }
  };

  return (
    <ProfileSection title="Invite players" meta={first ? `${first.totalReferrals.toLocaleString()} joined` : undefined}>
      {query.isLoading ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : query.isError ? (
        <p className="text-sm text-mist-400">{getApiErrorMessage(query.error, "Your referrals didn't load.")}</p>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
          <div className="flex flex-col gap-3 rounded-2xl bg-lavender-400/6 p-4 ring-1 ring-inset ring-lavender-400/25 sm:flex-row sm:items-center">
            <span className="min-w-0 flex-1">
              <span className="type-label block text-mist-500">Your code</span>
              <span className="type-display mt-1 block truncate text-xl tracking-wide">{code || "Not generated yet"}</span>
            </span>
            <Button size="sm" icon="copy" disabled={!code} onClick={() => void copy()}>
              Copy invite link
            </Button>
          </div>
          {entries.length ? (
            <ul className="grid gap-1">
              {entries.slice(0, 6).map((entry) => (
                <li key={entry.userId}>
                  <Link to={`/profile/${encodeURIComponent(entry.username)}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/3">
                    <Avatar src={entry.profileImage} name={entry.username} size="sm" className="rounded-full" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{entry.username}</span>
                    {entry.rewardPoints ? <span className="type-label text-signal">+{entry.rewardPoints} GP</span> : null}
                    <span className="text-xs text-mist-500">{timeAgo(entry.joinedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-mist-400">Share your link with friends and teammates. Everyone who joins with it is listed here.</p>
          )}
        </div>
      )}
    </ProfileSection>
  );
}
