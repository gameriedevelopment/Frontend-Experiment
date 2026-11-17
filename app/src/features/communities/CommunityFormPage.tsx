import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FileDrop } from "@/components/ui/FileDrop";
import { FilterMenu } from "@/components/ui/FilterMenu";
import { Icon } from "@/components/ui/Icon";
import { OptionCards } from "@/components/ui/OptionCards";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { TimeZoneField, deviceTimeZone } from "@/components/ui/TimeZoneField";
import { useGameOptions } from "@/features/games/hooks";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { CommunityCard } from "./components/CommunityCard";
import { hrefOf, type Community } from "./format";
import { useCommunityDetail, useCreateCommunity, useUpdateCommunity } from "./hooks";
import { COMMUNITY_REGIONS, TEAM_LEVELS } from "./options";
import type { CommunityFormPayload, CommunityKind, HubSummary, TeamSummary } from "./types";

const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const schema = z.object({
  name: z.string().trim().min(3, "Use at least 3 characters.").max(60, "Keep the name under 60 characters."),
  description: z.string().trim().min(20, "Add at least 20 characters so people understand what this is.").max(700, "Keep it under 700 characters."),
  teamMessage: z.string().trim().max(300, "Keep this under 300 characters."),
  organizationName: z.string().trim().max(100),
  vatNumber: z.string().trim().max(80),
  country: z.string().trim().max(80),
  games: z.array(z.object({ id: z.string(), name: z.string() })).max(12, "Pick up to 12 games."),
});

interface FormState {
  name: string;
  description: string;
  region: string;
  country: string;
  timezone: string;
  platforms: string[];
  games: Array<{ id: string; name: string; platforms: string[] }>;
  level: string;
  teamMessage: string;
  type: "community" | "organization";
  visibility: "public" | "private";
  joinPolicy: "open" | "request";
  organizationName: string;
  vatNumber: string;
}

const blank = (): FormState => ({
  name: "",
  description: "",
  region: "",
  country: "",
  timezone: deviceTimeZone(),
  platforms: [],
  games: [],
  level: "Amateur",
  teamMessage: "",
  type: "community",
  visibility: "public",
  joinPolicy: "open",
  organizationName: "",
  vatNumber: "",
});

function fromItem(item: Community): FormState {
  const team = item as TeamSummary;
  const hub = item as HubSummary;
  return {
    ...blank(),
    name: item.name ?? "",
    description: item.description ?? "",
    region: item.region ?? "",
    country: item.country ?? "",
    timezone: item.timezone || blank().timezone,
    platforms: item.platforms ?? [],
    games: (item.games ?? []).filter((game) => game.id).map((game) => ({ id: game.id!, name: game.name, platforms: game.platforms ?? [] })),
    level: team.level || "Amateur",
    teamMessage: team.teamMessage ?? "",
    type: hub.type === "organization" ? "organization" : "community",
    visibility: hub.visibility === "private" ? "private" : "public",
    joinPolicy: hub.joinPolicy === "request" ? "request" : "open",
    organizationName: hub.organizationName ?? "",
    vatNumber: hub.vatNumber ?? "",
  };
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-7">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-mist-400">{description}</p>}
      <div className="mt-6 grid gap-6">{children}</div>
    </section>
  );
}

function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => (url ? URL.revokeObjectURL(url) : undefined), [url]);
  return url;
}

export function CommunityFormPage({ kind }: { kind: CommunityKind }) {
  const { communitySlug } = useParams();
  const editing = Boolean(communitySlug);
  const navigate = useNavigate();
  const detail = useCommunityDetail(kind, communitySlug);
  const create = useCreateCommunity(kind);
  const update = useUpdateCommunity(kind, communitySlug);
  const mutation = editing ? update : create;
  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [gameQuery, setGameQuery] = useState("");
  const loaded = useRef(false);
  const games = useGameOptions(useDebouncedValue(gameQuery), true);
  const logoUrl = useObjectUrl(logo);
  const bannerUrl = useObjectUrl(banner);

  useEffect(() => {
    if (editing && detail.data && !loaded.current) {
      setForm(fromItem(detail.data));
      loaded.current = true;
    }
  }, [detail.data, editing]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const gameOptions = useMemo<ComboboxOption[]>(
    () =>
      (games.data?.data ?? [])
        .filter((game) => !form.games.some((picked) => picked.id === game.id))
        .slice(0, gameQuery.trim() ? 20 : 10)
        .map((game) => ({ value: game.id, label: game.name, description: game.gameType })),
    [form.games, games.data, gameQuery],
  );

  const preview = useMemo(
    () =>
      ({
        id: "preview",
        name: form.name || (kind === "team" ? "Your team" : "Your hub"),
        description: form.description,
        region: form.region,
        country: form.country,
        level: form.level,
        type: form.type,
        visibility: form.visibility,
        games: form.games,
        logo: logoUrl ?? detail.data?.logo,
        backgroundImage: bannerUrl ?? detail.data?.backgroundImage,
        membersCount: editing ? detail.data?.membersCount : 1,
        teamsCount: (detail.data as HubSummary | undefined)?.teamsCount ?? 0,
      }) as Community,
    [bannerUrl, detail.data, editing, form, kind, logoUrl],
  );

  if (editing && detail.isLoading) return <Skeleton className="h-160 rounded-card" />;
  if (editing && (detail.isError || !detail.data))
    return <StatePanel icon="warning" tone="danger" title={`This ${kind} didn't load`} description={getApiErrorMessage(detail.error, "Try again in a moment.")} />;
  if (editing && detail.data && !detail.data.viewerRelationship?.isOwner)
    return <StatePanel icon="lock" title="Only the owner can edit this" description={`Ask ${detail.data.name}'s owner to make the change.`} />;

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      requestAnimationFrame(() => document.querySelector("[aria-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    const payload: CommunityFormPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      country: form.country.trim() || undefined,
      region: form.region || undefined,
      timezone: form.timezone || undefined,
      platforms: form.platforms,
      games: form.games.map((game) => ({ ...game, platforms: game.platforms.length ? game.platforms : form.platforms })),
      ...(kind === "team"
        ? { level: form.level, teamMessage: form.teamMessage.trim() || undefined }
        : {
            type: form.type,
            visibility: form.visibility,
            joinPolicy: form.visibility === "private" ? "request" : form.joinPolicy,
            organizationName: form.type === "organization" ? form.organizationName.trim() || undefined : undefined,
            vatNumber: form.type === "organization" ? form.vatNumber.trim() || undefined : undefined,
          }),
    };
    try {
      const files = { logo: logo ?? undefined, background: banner ?? undefined };
      const result = editing && detail.data ? await update.mutateAsync({ id: detail.data.id, payload, files }) : await create.mutateAsync({ payload, files });
      toast.success(editing ? "Changes saved" : kind === "team" ? "Team created" : "Hub created", editing ? undefined : "Invite people from the Manage tab.");
      navigate(hrefOf(kind, { slug: result?.slug || (editing ? communitySlug : slugify(form.name)), id: result?.id ?? "" }), { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(error, "");
      if (/name.+(exists|taken)/i.test(message)) setErrors({ name: `A ${kind} with this name already exists.` });
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <header className="grid gap-4">
        <Link
          to={editing && detail.data ? hrefOf(kind, detail.data) : `/${kind}s`}
          className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 hover:text-mist-50"
        >
          <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
          {editing ? "Back" : kind === "team" ? "Teams" : "Hubs"}
        </Link>
        <div>
          <h1 className="type-display text-heading">{editing ? `Edit ${detail.data?.name}` : kind === "team" ? "Start a team" : "Start a hub"}</h1>
          <p className="mt-3 max-w-xl text-[0.95rem] text-mist-400">
            {kind === "team"
              ? "A team plays challenges, tournaments and ladders as one side, with a shared record and chat."
              : "A hub brings players and whole teams together around a game, a place or an organisation."}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <fieldset disabled={mutation.isPending} className="grid min-w-0 gap-6">
          <Card title="Identity" description="What people see first, everywhere the name appears.">
            <TextField id="community-name" label="Name" maxLength={60} value={form.name} onChange={(event) => set("name", event.target.value)} error={errors.name} />
            <TextAreaField
              id="community-description"
              label="Description"
              maxLength={700}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              error={errors.description}
              placeholder={kind === "team" ? "Who you are, what you play, and the players you're looking for." : "What brings people here, and who it's for."}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FileDrop label="Logo" hint="Square, up to 5 MB" accept={IMAGE_TYPES} maxBytes={5 * 1024 * 1024} currentUrl={detail.data?.logo} file={logo} onFile={setLogo} />
              <FileDrop label="Banner" hint="Wide, up to 8 MB" accept={IMAGE_TYPES} maxBytes={8 * 1024 * 1024} currentUrl={detail.data?.backgroundImage} file={banner} onFile={setBanner} />
            </div>
          </Card>

          {kind === "team" ? (
            <Card title="The team">
              <ChoiceGroup legend="Level" columns={5}>
                {TEAM_LEVELS.map((level) => (
                  <ChoiceChip key={level} name="team-level" value={level} label={level} checked={form.level === level} onChange={() => set("level", level)} />
                ))}
              </ChoiceGroup>
              <TextAreaField
                id="team-message"
                label="Message to new players (optional)"
                maxLength={300}
                value={form.teamMessage}
                onChange={(event) => set("teamMessage", event.target.value)}
                error={errors.teamMessage}
                placeholder="Scrims Tue and Thu, 8pm. Comms in English."
              />
            </Card>
          ) : (
            <Card title="The hub">
              <OptionCards
                legend="Kind"
                value={form.type}
                onChange={(value) => set("type", value as FormState["type"])}
                options={[
                  { value: "community", label: "Community", description: "Players and teams around a game, a city or a shared interest.", icon: "people" },
                  { value: "organization", label: "Organization", description: "A club, school, company or esports org.", icon: "building" },
                ]}
              />
              {form.type === "organization" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField id="org-name" label="Organization name" maxLength={100} value={form.organizationName} onChange={(event) => set("organizationName", event.target.value)} error={errors.organizationName} />
                  <TextField id="org-vat" label="VAT number (optional)" maxLength={80} value={form.vatNumber} onChange={(event) => set("vatNumber", event.target.value)} />
                </div>
              )}
            </Card>
          )}

          <Card title="Where and when" description="Helps players nearby find you, and keeps match times sensible.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <span className="text-sm font-medium">Region</span>
                <FilterMenu label="Region" value={form.region} options={COMMUNITY_REGIONS} onChange={(value) => set("region", value)} anyLabel="Not set" />
              </div>
              <TextField id="community-country" label="Country (optional)" maxLength={80} value={form.country} onChange={(event) => set("country", event.target.value)} />
            </div>
            <TimeZoneField id="community-timezone" value={form.timezone} onChange={(zone) => set("timezone", zone)} />
          </Card>

          <Card title="Games and platforms">
            <ChoiceGroup legend="Platforms" columns={5}>
              {PLATFORMS.map((platform) => (
                <ChoiceChip
                  key={platform}
                  multiple
                  name="community-platforms"
                  value={platform}
                  label={platform}
                  checked={form.platforms.includes(platform)}
                  onChange={() => set("platforms", form.platforms.includes(platform) ? form.platforms.filter((item) => item !== platform) : [...form.platforms, platform])}
                />
              ))}
            </ChoiceGroup>
            <div className="grid gap-3">
              <Combobox
                id="community-games"
                label={`Games (${form.games.length}/12)`}
                placeholder="Search games to add"
                query={gameQuery}
                onQueryChange={setGameQuery}
                options={gameOptions}
                browse
                browseLabel="Popular games"
                loading={games.isFetching}
                value={null}
                onChange={(option) => {
                  if (!option || form.games.length >= 12) return;
                  set("games", [...form.games, { id: option.value, name: option.label, platforms: [] }]);
                  setGameQuery("");
                }}
              />
              {errors.games && <p className="text-sm text-danger">{errors.games}</p>}
              {form.games.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {form.games.map((game) => (
                    <li key={game.id} className="flex items-center gap-2 rounded-full bg-white/5 py-1.5 pl-3 pr-1.5 text-sm ring-1 ring-inset ring-white/8">
                      <Icon name="games" className="size-4 text-lavender-300" />
                      {game.name}
                      <button
                        type="button"
                        aria-label={`Remove ${game.name}`}
                        onClick={() => set("games", form.games.filter((item) => item.id !== game.id))}
                        className="grid size-6 place-items-center rounded-full text-mist-400 hover:bg-white/8 hover:text-mist-50"
                      >
                        <Icon name="close" className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {kind === "hub" && (
            <Card title="Access" description="You can change this later from Manage.">
              <OptionCards
                legend="Visibility"
                value={form.visibility}
                onChange={(value) => set("visibility", value as FormState["visibility"])}
                options={[
                  { value: "public", label: "Public", description: "Anyone can see members, teams and posts.", icon: "globe" },
                  { value: "private", label: "Private", description: "Only members see inside. People join by request.", icon: "lock" },
                ]}
              />
              <OptionCards
                legend="Joining"
                value={form.visibility === "private" ? "request" : form.joinPolicy}
                onChange={(value) => set("joinPolicy", value as FormState["joinPolicy"])}
                disabled={form.visibility === "private"}
                options={[
                  { value: "open", label: "Open", description: "Players join in one tap.", icon: "follow" },
                  { value: "request", label: "By request", description: "You approve each request.", icon: "hourglass" },
                ]}
              />
            </Card>
          )}
        </fieldset>

        <aside className="grid gap-4 lg:sticky lg:top-24">
          <p className="type-label text-mist-500">Preview</p>
          <CommunityCard kind={kind} item={preview} />
          {mutation.isError && !errors.name && (
            <p role="alert" className="flex items-start gap-2 text-sm text-danger">
              <Icon name="warning" className="mt-0.5 size-4 shrink-0" />
              {getApiErrorMessage(mutation.error, "That didn't save. Try again in a moment.")}
            </p>
          )}
          <Button icon={editing ? "check" : "plus"} disabled={mutation.isPending} onClick={() => void submit()}>
            {mutation.isPending ? "Saving…" : editing ? "Save changes" : kind === "team" ? "Create team" : "Create hub"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
