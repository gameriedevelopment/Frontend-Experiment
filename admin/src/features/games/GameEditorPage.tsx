import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBreadcrumb } from "@/app/shell/crumb";
import { Panel } from "@/components/layout/Panel";
import { BackLink } from "@/components/record/BackLink";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Stamp } from "@/components/record/Stamp";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FileDrop } from "@/components/ui/FileDrop";
import { Notice } from "@/components/ui/Notice";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { TagInput } from "@/components/ui/TagInput";
import { getApiErrorMessage } from "@/lib/errors";
import { figure, formatDate } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { createGame, deleteGame, updateGame } from "./api";
import { adapterLabel, coverOf, PLATFORMS } from "./catalog";
import { gameKeys, useGame, useGameSummary } from "./hooks";
import type { GameInput, GameRow } from "./types";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const blank: GameInput = {
  name: "",
  company: "",
  gameType: "",
  description: "",
  platforms: [],
  gameModes: [],
  requiredSkills: [],
  officialWebsite: "",
  integrationKey: "",
  matchVerificationAdapter: "",
};

const fromGame = (game: GameRow): GameInput => ({
  name: game.name,
  company: game.company ?? "",
  gameType: game.gameType ?? "",
  description: game.description ?? "",
  platforms: game.platforms ?? [],
  gameModes: game.gameModes ?? [],
  requiredSkills: game.requiredSkills ?? [],
  officialWebsite: game.officialWebsite ?? "",
  integrationKey: game.integrationKey ?? "",
  matchVerificationAdapter: game.matchVerificationAdapter ?? "",
});

const isUrl = (value: string) => {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
};

export function GameEditorPage() {
  const { gameId } = useParams();
  const game = useGame(gameId);
  useDocumentTitle(gameId ? (game.data?.name ?? "Game") : "Add a game");
  useBreadcrumb(gameId ? game.data?.name : "Add a game");

  if (gameId && game.isLoading)
    return (
      <div className="grid gap-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-96 rounded-card" />
          <Skeleton className="aspect-video rounded-card" />
        </div>
      </div>
    );
  if (gameId && !game.data)
    return (
      <div className="grid gap-6">
        <BackLink to="/games" label="Games" />
        <StatePanel icon="warning" tone="danger" title="This game didn't load" description={getApiErrorMessage(game.error, "It may have been removed.")} />
      </div>
    );
  return <GameEditor key={gameId ?? "new"} game={game.data ?? null} />;
}

function GameEditor({ game }: { game: GameRow | null }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const summary = useGameSummary().data;
  const [baseline, setBaseline] = useState(() => (game ? fromGame(game) : blank));
  const [form, setForm] = useState(baseline);
  const [cover, setCover] = useState<File | null>(null);
  const [keyQuery, setKeyQuery] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof GameInput, string>>>({});
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [deleting, setDeleting] = useState(false);

  const set = <K extends keyof GameInput>(key: K, value: GameInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const changes = Object.fromEntries(
    (Object.keys(form) as Array<keyof GameInput>).filter((key) => JSON.stringify(form[key]) !== JSON.stringify(baseline[key])).map((key) => [key, form[key]]),
  ) as Partial<GameInput>;
  const dirty = Object.keys(changes).length > 0 || Boolean(cover);
  const inUse = game ? game.usersCount + game.teamsCount : 0;
  const live = Boolean(form.integrationKey && summary?.integrationKeys.includes(form.integrationKey));

  const keyOptions: ComboboxOption[] = (summary?.integrationKeys ?? [])
    .filter((key) => key.includes(keyQuery.trim().toLowerCase()))
    .map((key) => ({ value: key, label: key, description: "Live stats" }));
  const typedKey = keyQuery.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (typedKey && !keyOptions.some((option) => option.value === typedKey)) {
    keyOptions.push({ value: typedKey, label: typedKey, description: "Not connected yet, kept for a future integration" });
  }

  const validate = () => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Give the game a name.";
    if (!form.company.trim()) next.company = "Add the publisher.";
    if (!form.gameType.trim()) next.gameType = "Add a genre, like Battle Royale.";
    if (!form.description.trim()) next.description = "Describe the game in a sentence or two.";
    if (!isUrl(form.officialWebsite.trim())) next.officialWebsite = "Use a full link, starting with https://";
    if (!form.gameModes.length) next.gameModes = "Add at least one mode.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!dirty || !validate()) return;
    setSaving(true);
    setFailure(null);
    try {
      if (game) {
        await updateGame(game.id, changes, cover);
        setBaseline(form);
        setCover(null);
        toast.success("Game saved");
      } else {
        const created = await createGame(form, cover);
        toast.success(`${created.name} added`);
        navigate(`/games/${created.id}`, { replace: true });
      }
      void client.invalidateQueries({ queryKey: gameKeys.all });
    } catch (caught) {
      setFailure(caught);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void save(event)} noValidate className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          <h1 className="type-display break-words text-display-sm text-mist-50">{game ? form.name || game.name : "Add a game"}</h1>
          {game && (
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-mist-400">
              {live && (
                <Stamp tone="signal" icon="pulse">
                  Live stats
                </Stamp>
              )}
              {form.matchVerificationAdapter && (
                <Stamp tone="lavender" icon="verified">
                  Verifies results
                </Stamp>
              )}
              <span>
                <span className="text-mist-100">{figure(game.usersCount)}</span> players
              </span>
              <span>
                <span className="text-mist-100">{figure(game.teamsCount)}</span> teams
              </span>
              <span>Added {formatDate(game.createdAt)}</span>
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="grid min-w-0 gap-6">
          <Panel title="Basics">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField id="game-name" label="Name" value={form.name} onChange={(event) => set("name", event.target.value)} error={errors.name} maxLength={120} />
              <TextField id="game-company" label="Publisher" value={form.company} onChange={(event) => set("company", event.target.value)} error={errors.company} maxLength={120} />
              <TextField id="game-type" label="Genre" placeholder="Battle Royale" value={form.gameType} onChange={(event) => set("gameType", event.target.value)} error={errors.gameType} maxLength={80} />
              <TextField
                id="game-website"
                label="Official website"
                type="url"
                inputMode="url"
                placeholder="https://"
                value={form.officialWebsite}
                onChange={(event) => set("officialWebsite", event.target.value)}
                error={errors.officialWebsite}
              />
              <div className="sm:col-span-2">
                <TextAreaField
                  id="game-description"
                  label="Description"
                  rows={4}
                  maxLength={2000}
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                  error={errors.description}
                />
              </div>
            </div>
          </Panel>

          <Panel title="How it's played">
            <div className="grid gap-6">
              <ChoiceGroup legend="Platforms" hint="Pick every one it's on" columns={5}>
                {PLATFORMS.map((platform) => (
                  <ChoiceChip
                    key={platform}
                    multiple
                    label={platform === "Nintendo Switch" ? "Switch" : platform}
                    checked={form.platforms.includes(platform)}
                    onChange={(event) => set("platforms", event.target.checked ? [...form.platforms, platform] : form.platforms.filter((item) => item !== platform))}
                  />
                ))}
              </ChoiceGroup>
              <div className="grid gap-2">
                <TagInput label="Modes" hint="Ranked, 5v5, Battle Royale" values={form.gameModes} onChange={(values) => set("gameModes", values)} placeholder="Add a mode" />
                {errors.gameModes && <p className="text-[0.8rem] text-danger">{errors.gameModes}</p>}
              </div>
              <TagInput label="Skills" hint="What players list as strengths" values={form.requiredSkills} onChange={(values) => set("requiredSkills", values)} placeholder="Add a skill" />
            </div>
          </Panel>

          <Panel title="Integrations" description="What Gamerie can read from the game itself.">
            <div className="grid gap-6">
              <Combobox
                id="game-integration"
                label="Integration key"
                placeholder="Search keys"
                browse
                browseLabel="Keys with live stats"
                query={keyQuery}
                onQueryChange={setKeyQuery}
                options={keyOptions}
                value={form.integrationKey ? { value: form.integrationKey, label: form.integrationKey, description: live ? "Live stats" : "Not connected yet" } : null}
                onChange={(option) => set("integrationKey", option?.value ?? "")}
                hint="Links the game to its stats source. Each key belongs to one game."
              />
              <ChoiceGroup legend="Match verification" hint="Checks result screenshots for this game" columns={4}>
                {["", ...(summary?.verificationAdapters ?? [])].map((key) => (
                  <ChoiceChip
                    key={key || "none"}
                    name="game-adapter"
                    label={key ? adapterLabel(key) : "Off"}
                    checked={form.matchVerificationAdapter === key}
                    onChange={() => set("matchVerificationAdapter", key)}
                  />
                ))}
              </ChoiceGroup>
            </div>
          </Panel>
        </div>

        <aside className="grid min-w-0 gap-6 lg:sticky lg:top-6">
          <Panel title="Cover">
            <FileDrop
              label="Cover image"
              hint="16:9, up to 5 MB"
              shape="cover"
              accept={IMAGE_TYPES}
              maxBytes={5 * 1024 * 1024}
              currentUrl={coverOf(game?.wallPhoto)}
              file={cover}
              onFile={setCover}
            />
          </Panel>
          {game && (
            <Panel title="Remove from the catalog">
              <p className="text-sm leading-relaxed text-mist-400">
                {inUse
                  ? `${figure(game.usersCount)} ${game.usersCount === 1 ? "player" : "players"} and ${figure(game.teamsCount)} ${game.teamsCount === 1 ? "team" : "teams"} list this game. It can be removed once none do.`
                  : "Nobody lists this game, so it can be removed."}
              </p>
              <Button type="button" tone="outline" size="sm" icon="trash" className="mt-4 text-danger" disabled={inUse > 0} onClick={() => setDeleting(true)}>
                Remove game
              </Button>
            </Panel>
          )}
        </aside>
      </div>

      {failure != null && <Notice tone="danger">{getApiErrorMessage(failure, "That didn't save. Try again.")}</Notice>}

      {(dirty || !game) && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card bg-ink-900/90 px-5 py-3 ring-1 ring-inset ring-white/10 backdrop-blur-md">
          <p className="text-sm text-mist-400">{game ? "Unsaved changes" : "Fill in the basics to add it"}</p>
          <div className="flex gap-2">
            {dirty && game && (
              <Button
                type="button"
                tone="ghost"
                size="sm"
                disabled={saving}
                onClick={() => {
                  setForm(baseline);
                  setCover(null);
                  setErrors({});
                }}
              >
                Discard
              </Button>
            )}
            <Button type="submit" size="sm" disabled={!dirty || saving}>
              {saving ? "Saving…" : game ? "Save changes" : "Add game"}
            </Button>
          </div>
        </div>
      )}

      {deleting && game && (
        <ReasonDialog
          title={`Remove ${game.name}?`}
          description="It leaves the catalog for good. This can't be undone."
          confirmLabel="Remove"
          icon="trash"
          onClose={() => setDeleting(false)}
          onConfirm={(reason) =>
            deleteGame(game.id, reason).then(() => {
              toast.info(`${game.name} removed`);
              void client.invalidateQueries({ queryKey: gameKeys.all });
              navigate("/games");
            })
          }
        />
      )}
    </form>
  );
}
