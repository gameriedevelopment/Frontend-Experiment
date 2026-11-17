import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Menu } from "@/components/ui/Menu";
import { SkeletonText } from "@/components/ui/Skeleton";
import { GameConnections } from "@/features/games/connections/GameConnections";
import { useGameOptions } from "@/features/games/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { usePlayerRankings, useUpdatePlayerProfile } from "../hooks";
import type { PlayerProfile, ProfileGame } from "../types";
import { EmptyLine, ProfileSection } from "./ProfileSection";

const platforms = ["PC", "PS5", "XBOX", "Switch", "Mobile"];
const levels = ["Beginner", "Intermediate", "Advanced", "Expert", "Pro"];

// The profile update replaces the whole list, so every entry is sent back in the shape the API stores.
function payloadOf(game: ProfileGame) {
  return {
    id: game.id,
    gameId: game.gameId || (game.game as { id?: string } | undefined)?.id,
    name: game.name || (game.game as { name?: string } | undefined)?.name,
    platform: game.platform || game.platforms?.[0],
    platforms: game.platforms?.length ? game.platforms : game.platform ? [game.platform] : [],
    skillLevel: game.skillLevel,
    rank: game.rankData?.rank || game.rank,
    nickname: game.nickname,
    gameUsername: game.gameUsername,
  };
}

const nameOf = (game: ProfileGame) => (game.game as { name?: string } | undefined)?.name || game.name || "Game";

function GameDialog({ profile, game, onClose }: { profile: PlayerProfile; game: ProfileGame | null; onClose: () => void }) {
  const update = useUpdatePlayerProfile(profile.id);
  const existing = (profile.gamesPlayed?.length ? profile.gamesPlayed : (profile.games ?? [])).map(payloadOf);
  const [query, setQuery] = useState("");
  const catalogue = useGameOptions(useDebouncedValue(query), !game);
  const [selected, setSelected] = useState<ComboboxOption | null>(
    game ? { value: String(payloadOf(game).gameId ?? ""), label: nameOf(game) } : null,
  );
  const [form, setForm] = useState({
    gameUsername: game?.gameUsername ?? "",
    platform: game?.platform || game?.platforms?.[0] || "",
    skillLevel: game?.skillLevel ?? "",
    rank: game?.rankData?.rank || game?.rank || "",
  });
  const options = useMemo<ComboboxOption[]>(
    () =>
      (catalogue.data?.data ?? [])
        .filter((item) => !existing.some((entry) => String(entry.gameId) === String(item.id)))
        .map((item) => ({ value: item.id, label: item.name, description: item.gameType })),
    [catalogue.data, existing],
  );

  const save = async () => {
    if (!selected) return;
    const next = {
      id: game?.id,
      gameId: selected.value,
      name: selected.label,
      gameUsername: form.gameUsername.trim(),
      platform: form.platform,
      platforms: form.platform ? [form.platform] : [],
      skillLevel: form.skillLevel,
      rank: form.rank.trim() || undefined,
    };
    const edited = (item: ReturnType<typeof payloadOf>) => (item.id && game?.id ? item.id === game.id : String(item.gameId) === String(selected.value));
    try {
      await update.mutateAsync({ gamesPlayed: (game ? existing.map((item) => (edited(item) ? next : item)) : [...existing, next]) as ProfileGame[] });
      toast.success(game ? "Game updated" : `${selected.label} added`, game ? undefined : "Players and teams can now find you by it.");
      onClose();
    } catch {
      // Shown in the dialog.
    }
  };

  return (
    <Dialog
      open
      title={game ? `Edit ${nameOf(game)}` : "Add a game"}
      description="How you play it: your in-game name, platform and level."
      icon="games"
      size="lg"
      onClose={onClose}
      dismissible={!update.isPending}
      footer={
        <>
          <Button tone="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!selected || !form.platform || update.isPending} onClick={() => void save()}>
            {update.isPending ? "Saving…" : game ? "Save" : "Add game"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
        {game ? (
          <p className="flex items-center gap-3 rounded-2xl bg-white/4 px-4 py-3 text-sm font-semibold ring-1 ring-inset ring-white/8">
            <Icon name="games" weight="duotone" className="size-5 text-lavender-300" />
            {nameOf(game)}
          </p>
        ) : (
          <Combobox
              browse
              browseLabel="Popular games"
            id="game-pick"
            label="Game"
            placeholder="Search games"
            query={query}
            onQueryChange={setQuery}
            options={options}
            loading={catalogue.isFetching}
            value={selected}
            onChange={setSelected}
            emptyText="No games match, or you've added it already"
          />
        )}
        <TextField id="game-username" label="In-game name" maxLength={60} value={form.gameUsername} onChange={(event) => setForm({ ...form, gameUsername: event.target.value })} placeholder="What players see in the game" />
        <ChoiceGroup legend="Platform" columns={5}>
          {platforms.map((platform) => (
            <ChoiceChip key={platform} name="game-platform" value={platform} checked={form.platform === platform} onChange={() => setForm({ ...form, platform })} label={platform} />
          ))}
        </ChoiceGroup>
        <ChoiceGroup legend="Level" columns={5}>
          {levels.map((level) => (
            <ChoiceChip key={level} name="game-level" value={level} checked={form.skillLevel === level} onChange={() => setForm({ ...form, skillLevel: level })} label={level} />
          ))}
        </ChoiceGroup>
        <TextField id="game-rank" label="Rank (optional)" maxLength={40} value={form.rank} onChange={(event) => setForm({ ...form, rank: event.target.value })} placeholder="Diamond 2" />
        {update.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(update.error, "The game couldn't be saved.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}

export function ProfileGames({ own, profile }: { own: boolean; profile: PlayerProfile }) {
  const query = usePlayerRankings(profile.id);
  const update = useUpdatePlayerProfile(profile.id);
  const games = profile.gamesPlayed?.length ? profile.gamesPlayed : (profile.games ?? []);
  const ranks = query.data ?? [];
  const [editing, setEditing] = useState<ProfileGame | "new" | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <ProfileSection
        title="Games"
        meta={
          own ? (
            <Button tone="ghost" size="sm" icon="plus" className="-mr-3" onClick={() => setEditing("new")}>
              Add game
            </Button>
          ) : (
            `${games.length} ${games.length === 1 ? "game" : "games"}`
          )
        }
      >
        {games.length ? (
          <ul className="divide-y divide-white/6">
            {games.map((game, index) => {
              const rank = ranks.find(
                (item) => String(item.gameId ?? (typeof item.game === "object" ? item.game?.id : "")) === String(game.gameId ?? game.game?.id ?? game.id),
              );
              return (
                <li key={game.id || index} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-lavender-400/10 text-lavender-300">
                    <Icon name="games" className="size-5" weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{nameOf(game)}</p>
                    <p className="mt-0.5 truncate text-xs text-mist-400">
                      {[game.gameUsername, game.platform || game.platforms?.join(" · "), game.skillLevel].filter(Boolean).join(" · ") || "Player account"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{game.rankData?.rank || game.rank || "Unranked"}</p>
                    {rank?.rankingScore != null && <p className="mt-0.5 text-xs text-mist-500">{Math.round(rank.rankingScore)} ranking score</p>}
                  </div>
                  {own && (
                    <Menu
                      label={`Options for ${nameOf(game)}`}
                      items={[
                        { label: "Edit", icon: "edit", onSelect: () => setEditing(game) },
                        { label: "Remove", icon: "trash", danger: true, onSelect: () => setRemoving(index) },
                      ]}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="grid gap-3">
            <EmptyLine>{own ? "Add the games you play so players and teams can find you by them." : "No games listed yet."}</EmptyLine>
            {own && (
              <Button size="sm" icon="plus" className="w-fit" onClick={() => setEditing("new")}>
                Add your main game
              </Button>
            )}
          </div>
        )}
        {query.isLoading && games.length > 0 && <SkeletonText lines={1} className="mt-4 max-w-40" />}
      </ProfileSection>

      {own && <GameConnections />}

      {editing && <GameDialog profile={profile} game={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={removing !== null}
        title="Remove this game?"
        description="It comes off your profile. Linked accounts and recorded matches stay."
        confirmLabel="Remove"
        pending={update.isPending}
        error={update.isError ? getApiErrorMessage(update.error, "It couldn't be removed.") : undefined}
        onConfirm={() =>
          update.mutate(
            { gamesPlayed: games.filter((_, index) => index !== removing).map(payloadOf) as ProfileGame[] },
            {
              onSuccess: () => {
                setRemoving(null);
                toast.info("Game removed");
              },
            },
          )
        }
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}
