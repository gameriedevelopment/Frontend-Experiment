import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { useGame } from "@/features/games/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { uploadLeagueImage } from "../api";
import { useCreateLeagueDraft, useLeague, useLeagueHostingOptions, usePublishLeague, useSaveLeagueDraft } from "../hooks";
import {
  LEAGUE_STEPS,
  emptyLeagueDraft,
  formatPayload,
  leagueDraftFromDetail,
  prizePayload,
  schedulePayload,
  validateLeagueStep,
  type LeagueDraftForm,
  type LeagueFormErrors,
  type LeagueStep,
} from "./draft";
import { BasicsStep, EntryStep, FormatStep, ReviewStep, RulesStep, ScheduleStep } from "./LeagueSteps";

const hints: Record<LeagueStep, string> = {
  basics: "Hub, game and what players see first",
  format: "Entrants, round robin, groups and playoffs",
  schedule: "Season dates and match night",
  rules: "Scoring, tiebreakers and game rules",
  entry: "Who can join, how many, and the prize",
  review: "Check everything and publish",
};

export function CreateLeaguePage() {
  const { leagueId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const hosting = useLeagueHostingOptions();
  const base = useLeague(leagueId);
  // A running league's next season is edited by its id; a brand-new league's draft is its current season.
  const draftSeasonId = base.data?.viewer.draftSeasonId ?? undefined;
  const existing = useLeague(draftSeasonId ? leagueId : undefined, draftSeasonId);
  const detail = draftSeasonId ? existing.data : base.data;
  const createDraft = useCreateLeagueDraft();
  const saveDraft = useSaveLeagueDraft(leagueId);
  const publishDraft = usePublishLeague(leagueId);
  const [form, setForm] = useState<LeagueDraftForm | null>(null);
  const [errors, setErrors] = useState<LeagueFormErrors>({});
  const [serverError, setServerError] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [imagePending, setImagePending] = useState(false);
  const initialised = useRef(false);
  const game = useGame(form?.basics.gameId || undefined);

  const requested = params.get("step") as LeagueStep | null;
  const step: LeagueStep = LEAGUE_STEPS.some((item) => item.key === requested) ? requested! : "basics";
  const stepIndex = LEAGUE_STEPS.findIndex((item) => item.key === step);

  useEffect(() => {
    if (initialised.current) return;
    if (leagueId && detail) {
      setForm(leagueDraftFromDetail(detail));
      initialised.current = true;
    } else if (!leagueId && hosting.data) {
      setForm(emptyLeagueDraft(hosting.data.hubs[0]?.id ?? ""));
      initialised.current = true;
    }
  }, [detail, hosting.data, leagueId]);

  const update = useCallback(<K extends keyof LeagueDraftForm>(section: K, patch: Partial<LeagueDraftForm[K]>) => {
    setForm((current) => (current ? { ...current, [section]: { ...current[section], ...patch } } : current));
    setErrors({});
    setServerError("");
  }, []);

  const goTo = (next: LeagueStep) => {
    setErrors({});
    setServerError("");
    setParams(next === "basics" ? {} : { step: next });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const pending = createDraft.isPending || saveDraft.isPending || publishDraft.isPending || imagePending;

  const saveStep = async () => {
    if (!form || step === "review") return;
    const stepErrors = validateLeagueStep(step, form);
    if (Object.keys(stepErrors).length) return setErrors(stepErrors);
    setServerError("");
    try {
      let id = leagueId;
      if (!id) id = (await createDraft.mutateAsync(form.basics)).id;
      else if (step === "basics") await saveDraft.mutateAsync({ basics: form.basics });
      else if (step === "format") await saveDraft.mutateAsync({ format: formatPayload(form), playoffs: form.playoffs });
      else if (step === "schedule") await saveDraft.mutateAsync({ schedule: schedulePayload(form) });
      else if (step === "rules") await saveDraft.mutateAsync({ rules: form.rules });
      else if (step === "entry") await saveDraft.mutateAsync({ joining: form.joining, prize: prizePayload(form) });
      if (step === "basics" && (cover || logo) && id) {
        setImagePending(true);
        try {
          if (cover) {
            await uploadLeagueImage(id, cover, "banner");
            setCover(null);
          }
          if (logo) {
            await uploadLeagueImage(id, logo, "logo");
            setLogo(null);
          }
        } finally {
          setImagePending(false);
        }
      }
      const next = LEAGUE_STEPS[stepIndex + 1].key;
      if (!leagueId) navigate(`/leagues/${id}/edit?step=${next}`, { replace: true });
      else goTo(next);
    } catch (error) {
      setServerError(getApiErrorMessage(error, "This step couldn't be saved."));
    }
  };

  const publish = async () => {
    if (!form || !leagueId) return;
    const problems = validateLeagueStep("review", form);
    if (Object.keys(problems).length) {
      setErrors(problems);
      setServerError("Some steps still need attention. Check the steps marked in the list.");
      return;
    }
    try {
      // Saving every section first means the publish checks run on what's on screen.
      await saveDraft.mutateAsync({
        format: formatPayload(form),
        playoffs: form.playoffs,
        schedule: schedulePayload(form),
        rules: form.rules,
        joining: form.joining,
        prize: prizePayload(form),
      });
      await publishDraft.mutateAsync();
      toast.success("Season published", "Entries are open. The schedule builds itself when the season starts.");
      navigate(`/leagues/${leagueId}`, { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "The season couldn't be published."));
    }
  };

  const loadError = hosting.error ?? base.error ?? existing.error;
  if (loadError)
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="This league didn't load"
        description={getApiErrorMessage(loadError, "Try again in a moment.")}
        action={
          <LinkButton to="/leagues" tone="outline" size="sm" icon="arrowLeft">
            Back to leagues
          </LinkButton>
        }
      />
    );
  if (leagueId && detail && detail.selectedSeason?.status !== "draft")
    return (
      <StatePanel
        icon="leagues"
        title="This season is already published"
        description="Its format and schedule are locked. You can still change the name, description, rules text and prize from Manage."
        action={
          <LinkButton to={`/leagues/${leagueId}?tab=manage`} tone="outline" size="sm" icon="arrowRight">
            Open Manage
          </LinkButton>
        }
      />
    );
  if (!form || !hosting.data)
    return (
      <div aria-hidden="true" className="grid gap-6">
        <Skeleton className="h-10 w-80 max-w-full rounded-full" />
        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-128 rounded-card" />
        </div>
      </div>
    );
  if (!leagueId && hosting.data.creationLocked)
    return (
      <StatePanel
        icon="lock"
        title="Creating leagues is paused for your account"
        description="A Gamerie admin has stopped this account from creating ladders and leagues. Contact support if you think this is a mistake."
        action={
          <LinkButton to="/leagues" tone="outline" size="sm" icon="arrowLeft">
            Back to leagues
          </LinkButton>
        }
      />
    );
  if (!leagueId && !hosting.data.hubs.length)
    return (
      <StatePanel
        icon="hub"
        title="Leagues run from a hub"
        description="Owners, admins and managers of a hub can start a league for it. Create a hub, or ask your hub's owner for a manager role."
        action={
          <LinkButton to="/hubs" tone="outline" size="sm" icon="arrowRight">
            Go to hubs
          </LinkButton>
        }
      />
    );

  const nextSeason = Boolean(detail && detail.status !== "draft");
  const hostName = detail?.host.name ?? hosting.data.hubs.find((hub) => hub.id === form.basics.hubId)?.name ?? "Your hub";
  const seasonNumber = detail?.selectedSeason?.number ?? 1;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <header className="grid gap-4">
        <Link to={leagueId && nextSeason ? `/leagues/${leagueId}` : "/leagues"} className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 hover:text-mist-50">
          <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
          {nextSeason ? "Back to league" : "Leagues"}
        </Link>
        <div>
          <h1 className="type-display text-heading">{nextSeason ? `${detail?.name}: season ${seasonNumber}` : form.basics.name || "Start a league"}</h1>
          <p className="mt-3 text-[0.95rem] text-mist-400">
            {pending ? "Saving…" : nextSeason ? "Players see this season once you publish it. Until then the last season stays on the league page." : "Your draft saves after every step. Only your hub's managers can see it until you publish."}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <nav aria-label="Steps" className="lg:sticky lg:top-24">
          <ol className="relative -mx-1 flex gap-1 overflow-x-auto px-1 scrollbar-none lg:mx-0 lg:grid lg:grid-cols-[minmax(0,1fr)] lg:px-0">
            {LEAGUE_STEPS.map((item, index) => (
              <li key={item.key} className="shrink-0">
                <button
                  type="button"
                  disabled={!leagueId && index > 0}
                  aria-current={item.key === step ? "step" : undefined}
                  onClick={() => goTo(item.key)}
                  className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors disabled:opacity-40", item.key === step ? "bg-white/6" : "hover:bg-white/4")}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 ring-inset",
                      item.key === step ? "bg-lavender-400 text-ink-950 ring-lavender-400" : index < stepIndex ? "bg-signal/12 text-signal ring-signal/30" : "text-mist-500 ring-white/12",
                    )}
                  >
                    {index < stepIndex ? <Icon name="check" weight="bold" className="size-3.5" /> : index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block whitespace-nowrap text-sm font-medium", item.key === step ? "text-mist-50" : "text-mist-300")}>{item.label}</span>
                    <span className="mt-0.5 hidden text-xs leading-snug text-mist-500 lg:block">{hints[item.key]}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <section aria-labelledby="league-step" className="overflow-hidden rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
          <header className="border-b border-white/6 px-5 py-5 sm:px-7">
            <p className="type-label text-mist-500">
              Step {stepIndex + 1} of {LEAGUE_STEPS.length}
            </p>
            <h2 id="league-step" className="mt-2 text-xl font-semibold">
              {LEAGUE_STEPS[stepIndex].label}
            </h2>
            <p className="mt-1 text-sm text-mist-400">{hints[step]}</p>
          </header>
          <div className="px-5 py-6 sm:px-7 sm:py-7">
            <fieldset disabled={pending} className="min-w-0">
              {step === "basics" ? (
                <BasicsStep
                  form={form}
                  errors={errors}
                  update={update}
                  hosting={hosting.data}
                  hostLocked={Boolean(leagueId)}
                  cover={{ file: cover, url: detail?.banner ?? null }}
                  onCover={setCover}
                  logo={{ file: logo, url: detail?.logo ?? null }}
                  onLogo={setLogo}
                />
              ) : step === "format" ? (
                <FormatStep form={form} errors={errors} update={update} />
              ) : step === "schedule" ? (
                <ScheduleStep form={form} errors={errors} update={update} />
              ) : step === "rules" ? (
                <RulesStep form={form} errors={errors} update={update} gameModes={game.data?.gameModes ?? []} />
              ) : step === "entry" ? (
                <EntryStep form={form} errors={errors} update={update} />
              ) : (
                <ReviewStep form={form} gameName={game.data?.name ?? detail?.game.name ?? ""} hostName={hostName} onEdit={goTo} />
              )}
            </fieldset>
            {serverError && (
              <p role="alert" className="mt-6 flex items-start gap-2 text-sm text-danger">
                <Icon name="warning" className="mt-0.5 size-4 shrink-0" />
                {serverError}
              </p>
            )}
          </div>
          <footer className="flex flex-wrap items-center gap-2 border-t border-white/6 px-5 py-4 sm:px-7">
            {stepIndex > 0 && (
              <Button tone="ghost" size="sm" icon="arrowLeft" disabled={pending} onClick={() => goTo(LEAGUE_STEPS[stepIndex - 1].key)}>
                Back
              </Button>
            )}
            <span className="flex-1" />
            {step === "review" ? (
              <Button size="sm" icon="leagues" disabled={pending} onClick={() => void publish()}>
                {pending ? "Publishing…" : nextSeason ? `Publish season ${seasonNumber}` : "Publish league"}
              </Button>
            ) : (
              <Button size="sm" icon="arrowRight" disabled={pending} onClick={() => void saveStep()}>
                {pending ? "Saving…" : leagueId ? "Save and continue" : "Create draft"}
              </Button>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}
