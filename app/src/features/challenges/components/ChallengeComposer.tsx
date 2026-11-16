import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { TextAreaField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { useAuthStore } from "@/features/auth/authStore";
import { useOwnedTeams } from "@/features/communities/hooks";
import { useSearchResults } from "@/features/discovery/hooks";
import { useGameOptions } from "@/features/games/hooks";
import { usePlayerProfile } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { cn } from "@/lib/cn";
import { useCreateChallenge, useEligibleLineupMembers } from "../hooks";
import type { ChallengeType } from "../types";
import { LineupPicker } from "./LineupPicker";

const formats = ["Best of 1", "Best of 3", "Best of 5", "Custom"];
const teamSizes = [1, 2, 3, 4, 5];

type Errors = Partial<Record<"target" | "source" | "lineup" | "game" | "schedule", string>>;

function TypeOption({
  type,
  current,
  icon,
  title,
  description,
  disabled,
  onSelect,
}: {
  type: ChallengeType;
  current: ChallengeType;
  icon: "challenges" | "team";
  title: string;
  description: string;
  disabled?: boolean;
  onSelect: (type: ChallengeType) => void;
}) {
  const active = type === current;
  return (
    <label className={cn("block", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
      <input
        type="radio"
        name="challenge-type"
        value={type}
        checked={active}
        disabled={disabled}
        onChange={() => onSelect(type)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3.5 ring-1 ring-inset transition-[background-color,box-shadow] duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lavender-400",
          active ? "bg-lavender-400/12 ring-lavender-400/70" : "bg-white/4 ring-white/10 hover:bg-white/7",
        )}
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
            active ? "bg-lavender-400 text-ink-950" : "bg-white/6 text-mist-300",
          )}
        >
          <Icon name={icon} weight="duotone" className="size-[1.1rem]" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="block truncate text-xs text-mist-400">{description}</span>
        </span>
      </span>
    </label>
  );
}

export function ChallengeComposer({
  open,
  initialType = "user",
  initialTarget,
  onClose,
  onCreated,
}: {
  open: boolean;
  initialType?: ChallengeType;
  initialTarget?: ComboboxOption | null;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const { owned: ownedTeams } = useOwnedTeams(user?.id);
  const profile = usePlayerProfile(user?.username || user?.id);
  const create = useCreateChallenge();

  const [type, setType] = useState<ChallengeType>(initialType);
  const [target, setTarget] = useState<ComboboxOption | null>(initialTarget ?? null);
  const [targetQuery, setTargetQuery] = useState("");
  const [sourceTeamId, setSourceTeamId] = useState("");
  const [game, setGame] = useState<ComboboxOption | null>(null);
  const [gameQuery, setGameQuery] = useState("");
  const [format, setFormat] = useState("Best of 3");
  const [teamSize, setTeamSize] = useState(5);
  const [when, setWhen] = useState("");
  const [lineup, setLineup] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const debouncedTarget = useDebouncedValue(targetQuery);
  const debouncedGame = useDebouncedValue(gameQuery);
  const players = useSearchResults("players", debouncedTarget, type === "user");
  const teams = useSearchResults("teams", debouncedTarget, type === "team");
  const games = useGameOptions(debouncedGame, open && !game);
  const eligible = useEligibleLineupMembers(sourceTeamId, type === "team" && Boolean(sourceTeamId));

  useEffect(() => setLineup([]), [sourceTeamId, teamSize, type]);
  useEffect(() => {
    if (type === "team" && !sourceTeamId && ownedTeams.length === 1) setSourceTeamId(ownedTeams[0].id);
  }, [ownedTeams, sourceTeamId, type]);

  const targetOptions = useMemo<ComboboxOption[]>(() => {
    if (type === "user") {
      return (players.data?.data ?? [])
        .filter((player) => player.id !== user?.id)
        .map((player) => ({
          value: player.id,
          label: player.username,
          description: player.gamerTitle || player.gameLevel || "Gamerie player",
          image: player.profileImage,
        }));
    }
    return (teams.data?.data ?? [])
      .filter((team) => !ownedTeams.some((own) => own.id === team.id))
      .map((team) => ({ value: team.id, label: team.name, description: team.level || "Gamerie team", image: team.logo }));
  }, [ownedTeams, players.data, teams.data, type, user?.id]);

  const gameOptions = useMemo<ComboboxOption[]>(
    () =>
      (games.data?.data ?? []).map((item) => ({ value: item.name, label: item.name, description: item.gameType })),
    [games.data],
  );
  const myGames = useMemo(
    () =>
      [...new Set((profile.data?.gamesPlayed ?? profile.data?.games ?? []).map((item) => item.name).filter(Boolean))]
        .slice(0, 4) as string[],
    [profile.data],
  );

  const switchType = (next: ChallengeType) => {
    setType(next);
    setTarget(null);
    setTargetQuery("");
    setErrors({});
  };

  const sourceTeam = ownedTeams.find((team) => team.id === sourceTeamId);
  const summary = [
    target ? `${type === "team" ? sourceTeam?.name || "Your team" : "You"} vs ${target.label}` : null,
    game?.label,
    format,
    type === "team" ? `${teamSize}v${teamSize}` : null,
    when
      ? new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(when))
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const submit = async () => {
    const next: Errors = {};
    if (!target) next.target = `Choose a ${type === "user" ? "player" : "team"} to challenge.`;
    if (type === "team" && !sourceTeamId) next.source = "Choose the team sending this challenge.";
    if (type === "team" && sourceTeamId && lineup.length !== teamSize) next.lineup = `Pick exactly ${teamSize} players.`;
    if (!game) next.game = "Choose a game.";
    if (!when) next.schedule = "Pick a day and a time.";
    else if (new Date(when).getTime() <= Date.now()) next.schedule = "Pick a time in the future.";
    setErrors(next);
    if (Object.keys(next).length || !target || !game) return;
    try {
      const challenge = await create.mutateAsync({
        type,
        challengedId: type === "user" ? target.value : undefined,
        challengedTeamId: type === "team" ? target.value : undefined,
        challengerTeamId: type === "team" ? sourceTeamId : undefined,
        game: game.value,
        scheduledDate: when,
        format,
        teamSize: type === "team" ? teamSize : undefined,
        challengerLineupPlayerIds: type === "team" ? lineup : undefined,
        message: message.trim() || undefined,
      });
      onCreated(challenge.id);
    } catch {
      // Shown above the footer.
    }
  };

  return (
    <Dialog
      open={open}
      title="New challenge"
      description="Set the terms up front. Your opponent sees exactly this before they accept."
      onClose={onClose}
      dismissible={!create.isPending}
      size="lg"
      footer={
        <>
          <span className="mr-auto hidden min-w-0 truncate text-sm text-mist-400 sm:block">{summary}</span>
          <Button tone="ghost" size="sm" disabled={create.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" icon="challenges" disabled={create.isPending} onClick={() => void submit()}>
            {create.isPending ? "Sending…" : "Send challenge"}
          </Button>
        </>
      }
    >
      <div className="grid gap-7">
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Challenge type</legend>
          <TypeOption
            type="user"
            current={type}
            icon="challenges"
            title="Player"
            description="You against another player"
            onSelect={switchType}
          />
          <TypeOption
            type="team"
            current={type}
            icon="team"
            title="Team"
            description={ownedTeams.length ? "A team you own against another" : "Own a team to send these"}
            disabled={!ownedTeams.length}
            onSelect={switchType}
          />
        </fieldset>

        {type === "team" && ownedTeams.length > 1 && (
          <ChoiceGroup legend="Your team" columns={2} error={errors.source}>
            {ownedTeams.map((team) => (
              <ChoiceChip
                key={team.id}
                name="source-team"
                value={team.id}
                checked={sourceTeamId === team.id}
                onChange={() => setSourceTeamId(team.id)}
                label={team.name}
              />
            ))}
          </ChoiceGroup>
        )}

        <Combobox
          id="challenge-target"
          label={type === "user" ? "Opponent" : "Opposing team"}
          placeholder={type === "user" ? "Search players by name" : "Search teams by name"}
          query={targetQuery}
          onQueryChange={setTargetQuery}
          options={targetOptions}
          loading={(type === "user" ? players : teams).isFetching}
          value={target}
          onChange={setTarget}
          error={errors.target}
          avatars
          emptyText={`No ${type === "user" ? "players" : "teams"} match that name`}
        />

        <div className="grid gap-3">
          <Combobox
            id="challenge-game"
            label="Game"
            placeholder="Search games"
            query={gameQuery}
            onQueryChange={setGameQuery}
            options={gameOptions}
            loading={games.isFetching}
            value={game}
            onChange={setGame}
            error={errors.game}
            emptyText="No games match that name"
          />
          {!game && myGames.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-mist-500">Your games</span>
              {myGames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setGame({ value: name, label: name })}
                  className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-mist-200 ring-1 ring-inset ring-white/10 transition-colors hover:bg-lavender-400/12 hover:ring-lavender-400/50"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <ChoiceGroup legend="Format" columns={4}>
          {formats.map((item) => (
            <ChoiceChip
              key={item}
              name="challenge-format"
              value={item}
              checked={format === item}
              onChange={() => setFormat(item)}
              label={item}
            />
          ))}
        </ChoiceGroup>

        {type === "team" && (
          <ChoiceGroup legend="Team size" columns={5}>
            {teamSizes.map((size) => (
              <ChoiceChip
                key={size}
                name="challenge-team-size"
                value={size}
                checked={teamSize === size}
                onChange={() => setTeamSize(size)}
                label={`${size}v${size}`}
              />
            ))}
          </ChoiceGroup>
        )}

        <ScheduleField value={when} onChange={setWhen} error={errors.schedule} />

        {type === "team" && sourceTeamId && (
          <LineupPicker
            members={eligible.data ?? []}
            selected={lineup}
            required={teamSize}
            onChange={setLineup}
            loading={eligible.isLoading}
            error={errors.lineup}
          />
        )}

        <TextAreaField
          id="challenge-message"
          label="Message (optional)"
          maxLength={400}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="House rules, server, platform, or anything they should know."
        />

        {create.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(create.error, "The challenge couldn't be sent. Try again.")}
          </p>
        )}
      </div>
    </Dialog>
  );
}
