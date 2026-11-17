import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { TextAreaField } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { OptionCards } from "@/components/ui/OptionCards";
import { ScheduleField } from "@/components/ui/ScheduleField";
import { useAuthStore } from "@/features/auth/authStore";
import { useOwnedTeams } from "@/features/communities/hooks";
import { useSearchResults } from "@/features/discovery/hooks";
import { useGameOptions } from "@/features/games/hooks";
import { usePlayerProfile } from "@/features/profile/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { ChallengeInvitePreview } from "./components/ChallengeInvitePreview";
import { LineupPicker } from "./components/LineupPicker";
import { useCreateChallenge, useEligibleLineupMembers } from "./hooks";
import type { ChallengeType } from "./types";

const formats = ["Best of 1", "Best of 3", "Best of 5", "Custom"];
const teamSizes = [1, 2, 3, 4, 5];

type Errors = Partial<Record<"target" | "source" | "lineup" | "game" | "schedule", string>>;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-white/6 pt-7 first:border-t-0 first:pt-0">
      <h2 className="text-sm font-semibold text-mist-50">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Compose a challenge. Opens prefilled from the URL: `type`, `target` and `targetName` pick the opponent,
 * and `game` and `format` carry over terms, which is how rematches and profile links arrive.
 */
export function NewChallengePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { owned: ownedTeams } = useOwnedTeams(user?.id);
  const profile = usePlayerProfile(user?.username || user?.id);
  const create = useCreateChallenge();

  const [type, setType] = useState<ChallengeType>(params.get("type") === "team" ? "team" : "user");
  const [target, setTarget] = useState<ComboboxOption | null>(
    params.get("target") ? { value: params.get("target")!, label: params.get("targetName") || "Selected opponent" } : null,
  );
  const [targetQuery, setTargetQuery] = useState("");
  const [sourceTeamId, setSourceTeamId] = useState(params.get("from") ?? "");
  const [game, setGame] = useState<ComboboxOption | null>(params.get("game") ? { value: params.get("game")!, label: params.get("game")! } : null);
  const [gameQuery, setGameQuery] = useState("");
  const [format, setFormat] = useState(formats.includes(params.get("format") ?? "") ? params.get("format")! : "Best of 3");
  const [teamSize, setTeamSize] = useState(Number(params.get("size")) || 5);
  const [when, setWhen] = useState("");
  const [lineup, setLineup] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const debouncedTarget = useDebouncedValue(targetQuery);
  const debouncedGame = useDebouncedValue(gameQuery);
  const players = useSearchResults("players", debouncedTarget, type === "user");
  const teams = useSearchResults("teams", debouncedTarget, type === "team");
  const games = useGameOptions(debouncedGame, !game);
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
    () => (games.data?.data ?? []).map((item) => ({ value: item.name, label: item.name, description: item.gameType })),
    [games.data],
  );
  const myGames = useMemo(
    () =>
      [...new Set((profile.data?.gamesPlayed ?? profile.data?.games ?? []).map((item) => item.name).filter(Boolean))].slice(
        0,
        5,
      ) as string[],
    [profile.data],
  );

  const switchType = (next: ChallengeType) => {
    setType(next);
    setTarget(null);
    setTargetQuery("");
    setErrors({});
  };

  const sourceTeam = ownedTeams.find((team) => team.id === sourceTeamId);

  const submit = async () => {
    const next: Errors = {};
    if (!target) next.target = `Choose a ${type === "user" ? "player" : "team"} to challenge.`;
    if (type === "team" && !sourceTeamId) next.source = "Choose the team sending this challenge.";
    if (type === "team" && sourceTeamId && lineup.length !== teamSize) next.lineup = `Pick exactly ${teamSize} players.`;
    if (!game) next.game = "Choose a game.";
    if (!when) next.schedule = "Pick a day and a time.";
    else if (new Date(when).getTime() <= Date.now()) next.schedule = "Pick a time in the future.";
    setErrors(next);
    if (Object.keys(next).length || !target || !game) {
      toast.error("A few things are missing", Object.values(next)[0]);
      return;
    }
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
      toast.success("Challenge sent", `${target.label} has been notified.`);
      navigate(`/challenges/${challenge.id}`, { replace: true });
    } catch {
      // Shown beside the send button.
    }
  };

  const sendBlock = (
    <div className="grid gap-3">
      <Button icon="challenges" className="w-full" disabled={create.isPending} onClick={() => void submit()}>
        {create.isPending ? "Sending…" : "Send challenge"}
      </Button>
      {create.isError && (
        <p role="alert" className="text-sm text-danger">
          {getApiErrorMessage(create.error, "The challenge couldn't be sent. Try again.")}
        </p>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <header className="grid gap-4">
        <Link
          to="/challenges"
          className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-mist-50"
        >
          <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
          Challenges
        </Link>
        <div>
          <h1 className="type-display text-heading">{params.get("rematch") ? "Rematch" : "New challenge"}</h1>
          <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-mist-300">
            Set the terms up front. Your opponent sees exactly this before they accept, and the result goes on both records.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="grid gap-7 rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-7">
          <Section title="Who">
            <OptionCards
              legend="Challenge type"
              value={type}
              onChange={switchType}
              options={[
                { value: "user", label: "Player", description: "You against another player", icon: "challenges" },
                {
                  value: "team",
                  label: "Team",
                  description: ownedTeams.length ? "A team you own against another" : "Own a team to send these",
                  icon: "team",
                  disabled: !ownedTeams.length,
                },
              ]}
            />
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
          </Section>

          <Section title="Terms">
            <div className="grid gap-3">
              <Combobox
              browse
              browseLabel="Popular games"
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
                <ChoiceChip key={item} name="challenge-format" value={item} checked={format === item} onChange={() => setFormat(item)} label={item} />
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
          </Section>

          <Section title="When">
            <ScheduleField label="Match time" days={21} value={when} onChange={setWhen} error={errors.schedule} />
          </Section>

          {type === "team" && sourceTeamId && (
            <Section title="Lineup">
              <LineupPicker
                members={eligible.data ?? []}
                selected={lineup}
                required={teamSize}
                onChange={setLineup}
                loading={eligible.isLoading}
                error={errors.lineup}
              />
            </Section>
          )}

          <Section title="Message">
            <TextAreaField
              id="challenge-message"
              label="A note for your opponent (optional)"
              maxLength={400}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="House rules, server, platform, or anything they should know."
            />
          </Section>

          <div className="lg:hidden">{sendBlock}</div>
        </div>

        <aside className="hidden gap-4 lg:sticky lg:top-24 lg:grid">
          <ChallengeInvitePreview
            from={{
              name: type === "team" ? sourceTeam?.name || "Your team" : user?.username || "You",
              image: type === "team" ? sourceTeam?.logo : user?.profileImage,
            }}
            to={target ? { name: target.label, image: target.image } : null}
            game={game?.label}
            format={type === "team" ? `${format} · ${teamSize}v${teamSize}` : format}
            when={when}
            message={message.trim()}
            team={type === "team" ? sourceTeam?.name : undefined}
          />
          <p className="text-center text-xs leading-relaxed text-mist-500">
            {target ? `This is what ${target.label} receives.` : "Your invite updates as you fill it in."}
          </p>
          {sendBlock}
        </aside>
      </div>
    </div>
  );
}
