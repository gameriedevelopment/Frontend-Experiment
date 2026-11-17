import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { useGame } from "@/features/games/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import * as tournamentsApi from "../api";
import { TournamentCard } from "../components/TournamentCard";
import { invalidateTournament, useHostedTournament, useHostingOptions } from "../hooks";
import type { HostedTournamentDetail, Tournament, TournamentPhase } from "../types";
import { fromLocalInput } from "../utils";
import {
  STEPS,
  completedSteps,
  draftFromTournament,
  emptyDraft,
  previewFormat,
  sectionPayload,
  validateStep,
  type DraftForm,
  type StepErrors,
  type StepKey,
} from "./draftForm";
import type { SectionUpdater } from "./stepTypes";
import { BasicsStep } from "./steps/BasicsStep";
import { FormatStep } from "./steps/FormatStep";
import { RegistrationStep } from "./steps/RegistrationStep";
import { ReviewStep } from "./steps/ReviewStep";
import { RulesStep } from "./steps/RulesStep";
import { ScheduleStep } from "./steps/ScheduleStep";

// Which steps can still change in each phase; the server enforces the same.
const editableSteps: Record<TournamentPhase, StepKey[]> = {
  draft: ["basics", "format", "rules", "registration", "schedule"],
  registration: ["basics", "format", "rules", "registration", "schedule"],
  check_in: ["basics", "rules"],
  awaiting_start: ["basics", "rules"],
  live: ["basics"],
  paused: ["basics"],
  completed: ["basics"],
  cancelled: [],
};
const savable = STEPS.filter((step) => step.key !== "review").map((step) => step.key);

function lockedFields(tournament?: HostedTournamentDetail) {
  const locked = new Set<string>();
  if (!tournament || tournament.phase === "draft") return locked;
  if (tournament.entrantCount > 0) ["host", "gameId", "mode", "entrantType", "bracketSize"].forEach((field) => locked.add(field));
  if (tournament.phase !== "registration") ["host", "gameId", "platform", "region", "mode", "venue"].forEach((field) => locked.add(field));
  return locked;
}

function PreviewPanel({ form, gameName, bannerUrl }: { form: DraftForm; gameName: string; bannerUrl: string | null }) {
  const preview = previewFormat(form.format, form.rules);
  const prize = form.schedule.hasPrize && Number(form.schedule.prizeTotal) ? Number(form.schedule.prizeTotal) : 0;
  const card: Tournament = {
    id: "preview",
    name: form.basics.name || "Your tournament",
    game: gameName || "Game",
    platform: form.basics.platform,
    format: form.format.format,
    startDate: fromLocalInput(form.schedule.startsAt),
    endDate: null,
    registrationDeadline: fromLocalInput(form.registration.registrationClosesAt),
    bracketSize: form.format.bracketSize,
    entrantCount: 0,
    entrantType: form.format.entrantType,
    teamSize: form.format.entrantType === "team" ? form.format.teamSize : null,
    source: "hosted",
    phase: "registration",
    image: bannerUrl,
    prize: prize ? { total: prize, currency: /^[A-Z]{3}$/.test(form.schedule.currency) ? form.schedule.currency : "USD", description: "" } : null,
  };
  return (
    <div className="grid gap-4">
      <p className="type-label text-mist-500">How it appears</p>
      <TournamentCard tournament={card} preview />
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/6 text-sm ring-1 ring-inset ring-white/6">
        {[
          ["Matches", String(preview.totalMatches)],
          ["Rounds", String(preview.lanes.reduce((sum, lane) => sum + lane.rounds.length, 0))],
        ].map(([label, value]) => (
          <div key={label} className="bg-ink-900 px-4 py-3">
            <dt className="type-label text-mist-500">{label}</dt>
            <dd className="mt-1 font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function CreateTournamentPage() {
  const { tournamentId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const hosting = useHostingOptions();
  const existing = useHostedTournament(tournamentId);
  const detail = existing.data;
  const [form, setForm] = useState<DraftForm | null>(null);
  const [dirty, setDirty] = useState<Set<StepKey>>(new Set());
  const [errors, setErrors] = useState<StepErrors>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"public" | "unlisted">("public");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const initialised = useRef(false);

  const requested = params.get("step") as StepKey | null;
  const step: StepKey = STEPS.some((item) => item.key === requested) ? requested! : "basics";
  const phase: TournamentPhase = detail?.phase ?? "draft";
  const editable = editableSteps[phase];
  const locked = useMemo(() => lockedFields(detail), [detail]);
  const done = useMemo(() => completedSteps(detail), [detail]);
  const game = useGame(form?.basics.gameId || undefined);

  useEffect(() => {
    if (initialised.current) return;
    if (tournamentId && detail) {
      setForm(draftFromTournament(detail));
      initialised.current = true;
    } else if (!tournamentId && hosting.data) {
      const self = hosting.data.hosts.find((host) => host.type === "user");
      const draft = emptyDraft(self ? `user:${self.id}` : "");
      setForm({ ...draft, basics: { ...draft.basics, gameId: params.get("gameId") ?? "" } });
      initialised.current = true;
    }
    // `gameId` is read once, so a game page can open the wizard with its game chosen.
  }, [detail, hosting.data, tournamentId]);

  useEffect(() => {
    if (!banner) return setBannerPreview(null);
    const url = URL.createObjectURL(banner);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [banner]);

  const update: SectionUpdater = useCallback((section, patch) => {
    setForm((current) => (current ? { ...current, [section]: { ...current[section], ...patch } } : current));
    setDirty((current) => new Set(current).add(section as StepKey));
    setErrors({});
    setServerError("");
  }, []);

  const goTo = (next: StepKey) => {
    setErrors({});
    setServerError("");
    setParams(next === "basics" ? {} : { step: next });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const persist = async (target: StepKey, currentId: string | undefined): Promise<string> => {
    if (!form) throw new Error("The form isn't ready yet.");
    if (!currentId) {
      const created = await tournamentsApi.createTournamentDraft(sectionPayload("basics", form).basics);
      if (banner) await tournamentsApi.uploadTournamentBanner(created.id, banner);
      return created.id;
    }
    await tournamentsApi.saveTournamentSettings(currentId, sectionPayload(target, form));
    if (target === "basics" && banner) await tournamentsApi.uploadTournamentBanner(currentId, banner);
    return currentId;
  };

  const saveStep = async (advance: boolean) => {
    if (!form || step === "review") return;
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      return;
    }
    const nextStep = STEPS[STEPS.findIndex((item) => item.key === step) + 1].key;
    if (!editable.includes(step)) return goTo(nextStep);
    setSaving(true);
    try {
      const id = await persist(step, tournamentId);
      setBanner(null);
      setDirty((current) => {
        const next = new Set(current);
        next.delete(step);
        return next;
      });
      setSavedAt(new Date());
      invalidateTournament(client, id);
      if (!tournamentId) navigate(`/tournaments/${id}/edit${advance ? `?step=${nextStep}` : ""}`, { replace: true });
      else if (advance) goTo(nextStep);
      else toast.success("Saved");
    } catch (error) {
      setServerError(getApiErrorMessage(error, "This step couldn't be saved."));
    } finally {
      setSaving(false);
    }
  };

  const problems = useMemo(() => {
    if (!form) return [];
    const list: Array<{ step: StepKey; message: string }> = [];
    for (const key of savable) {
      const stepErrors = Object.values(validateStep(key, form)).filter(Boolean) as string[];
      stepErrors.forEach((message) => list.push({ step: key, message }));
      if (!stepErrors.length && !done.has(key) && !dirty.has(key)) list.push({ step: key, message: "Not filled in yet" });
    }
    return list;
  }, [dirty, done, form]);

  const publish = async () => {
    if (!tournamentId || !form) return;
    setSaving(true);
    setServerError("");
    try {
      for (const key of savable.filter((item) => dirty.has(item))) await persist(key, tournamentId);
      setDirty(new Set());
      if (phase === "draft") await tournamentsApi.publishTournament(tournamentId, visibility);
      invalidateTournament(client, tournamentId);
      toast.success(phase === "draft" ? "Tournament published" : "Changes saved", phase === "draft" ? "Entries are open." : undefined);
      navigate(`/tournaments/${tournamentId}`, { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "The tournament couldn't be published."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!tournamentId) return;
    setSaving(true);
    try {
      await tournamentsApi.deleteTournamentDraft(tournamentId);
      invalidateTournament(client, tournamentId);
      toast.info("Draft deleted");
      navigate("/tournaments", { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "The draft couldn't be deleted."));
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  };

  if (hosting.isError || existing.isError) {
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="This tournament didn't load"
        description={getApiErrorMessage(existing.error ?? hosting.error, "Try again in a moment.")}
        action={
          <LinkButton to="/tournaments" tone="outline" size="sm" icon="arrowLeft">
            Back to tournaments
          </LinkButton>
        }
      />
    );
  }
  if (!form || !hosting.data) {
    return (
      <div aria-hidden="true" className="grid gap-6">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-10 w-80 max-w-full rounded-full" />
        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-card" />
          <Skeleton className="h-128 rounded-card" />
        </div>
      </div>
    );
  }
  if (!tournamentId && hosting.data.restriction) {
    return (
      <StatePanel
        icon="lock"
        tone="danger"
        title="Hosting is locked for your account"
        description={hosting.data.restriction.reason}
        action={
          <LinkButton to="/tournaments" tone="outline" size="sm" icon="arrowLeft">
            Back to tournaments
          </LinkButton>
        }
      />
    );
  }

  const stepIndex = STEPS.findIndex((item) => item.key === step);
  const current = STEPS[stepIndex];
  const stepLocked = step !== "review" && !editable.includes(step);
  const published = phase !== "draft";
  const gameName = game.data?.name ?? detail?.game ?? "";
  const props = { form, update, errors, locked };
  const status = saving
    ? "Saving…"
    : savedAt
      ? `Saved at ${savedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
      : published
        ? "Changes to the format, schedule or prize notify everyone entered."
        : "Your draft saves after every step. Only you can see it until you publish.";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <header className="grid gap-4">
        <Link
          to={tournamentId && published ? `/tournaments/${tournamentId}` : "/tournaments"}
          className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-mist-50"
        >
          <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
          {published ? "Back to tournament" : "Tournaments"}
        </Link>
        <div>
          <h1 className="type-display text-heading">
            {published ? detail?.name : tournamentId ? form.basics.name || "Untitled tournament" : "Host a tournament"}
          </h1>
          <p aria-live="polite" className="mt-3 text-[0.95rem] text-mist-400">
            {status}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_19rem] lg:items-start">
        <nav aria-label="Steps" className="lg:sticky lg:top-24">
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/8 lg:hidden">
            <div className="h-full rounded-full bg-lavender-400 transition-[width] duration-500" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
          </div>
          <ol className="relative -mx-1 flex gap-1 overflow-x-auto px-1 scrollbar-none lg:mx-0 lg:grid lg:grid-cols-[minmax(0,1fr)] lg:px-0">
            {STEPS.map((item, index) => {
              const state = item.key === step ? "current" : dirty.has(item.key) ? "dirty" : done.has(item.key) ? "done" : "todo";
              const reachable = Boolean(tournamentId) || index === 0;
              return (
                <li key={item.key} className="shrink-0">
                  <button
                    type="button"
                    disabled={!reachable}
                    aria-current={item.key === step ? "step" : undefined}
                    onClick={() => goTo(item.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      state === "current" ? "bg-white/6" : "hover:bg-white/4",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 ring-inset",
                        state === "current" && "bg-lavender-400 text-ink-950 ring-lavender-400",
                        state === "done" && "bg-signal/12 text-signal ring-signal/30",
                        state === "dirty" && "text-lavender-300 ring-lavender-400/50",
                        state === "todo" && "text-mist-500 ring-white/12",
                      )}
                    >
                      {state === "done" ? <Icon name="check" weight="bold" className="size-3.5" /> : index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block whitespace-nowrap text-sm font-medium", state === "current" ? "text-mist-50" : "text-mist-300")}>
                        {item.label}
                      </span>
                      <span className="mt-0.5 hidden text-xs leading-snug text-mist-500 lg:block">
                        {item.key !== "review" && published && !editable.includes(item.key) ? "Locked" : state === "dirty" ? "Unsaved changes" : item.hint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <section aria-labelledby="step-title" className="overflow-hidden rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
          <header className="border-b border-white/6 px-5 py-5 sm:px-7">
            <p className="type-label text-mist-500">
              Step {stepIndex + 1} of {STEPS.length}
            </p>
            <h2 id="step-title" className="mt-2 text-xl font-semibold">
              {current.label}
            </h2>
            <p className="mt-1 text-sm text-mist-400">{current.hint}</p>
          </header>

          <div className="px-5 py-6 sm:px-7 sm:py-7">
            {stepLocked && (
              <p className="mb-6 flex items-start gap-2.5 rounded-2xl bg-white/4 px-4 py-3 text-sm text-mist-300 ring-1 ring-inset ring-white/8">
                <Icon name="lock" className="mt-0.5 size-4 shrink-0 text-mist-400" />
                {phase === "cancelled"
                  ? "This tournament was cancelled and can't be edited."
                  : "This step is locked now that the tournament has moved on."}
              </p>
            )}
            <fieldset disabled={stepLocked || saving} className="min-w-0">
              {step === "basics" ? (
                <BasicsStep {...props} hosts={hosting.data.hosts} banner={{ file: banner, url: detail?.banner ?? null }} onBanner={(file) => {
                  setBanner(file);
                  setDirty((currentDirty) => new Set(currentDirty).add("basics"));
                }} />
              ) : step === "format" ? (
                <FormatStep {...props} />
              ) : step === "rules" ? (
                <RulesStep {...props} />
              ) : step === "registration" ? (
                <RegistrationStep {...props} />
              ) : step === "schedule" ? (
                <ScheduleStep {...props} />
              ) : (
                <ReviewStep
                  form={form}
                  gameName={gameName}
                  hosts={hosting.data.hosts}
                  problems={published ? [] : problems}
                  visibility={visibility}
                  onVisibility={setVisibility}
                  onEdit={goTo}
                  published={published}
                />
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
              <Button tone="ghost" size="sm" icon="arrowLeft" disabled={saving} onClick={() => goTo(STEPS[stepIndex - 1].key)}>
                Back
              </Button>
            )}
            {tournamentId && phase === "draft" && step === "review" && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-sm font-medium text-mist-500 transition-colors hover:text-danger"
              >
                Delete draft
              </button>
            )}
            <span className="flex-1" />
            {step !== "review" && tournamentId && dirty.has(step) && (
              <Button tone="outline" size="sm" disabled={saving} onClick={() => void saveStep(false)}>
                Save
              </Button>
            )}
            {step === "review" ? (
              <Button size="sm" icon={published ? "check" : "trophy"} disabled={saving || (!published && problems.length > 0)} onClick={() => void publish()}>
                {saving ? "Working…" : published ? "Save changes" : "Publish"}
              </Button>
            ) : (
              <Button size="sm" icon="arrowRight" disabled={saving} onClick={() => void saveStep(true)}>
                {saving ? "Saving…" : stepLocked ? "Next" : tournamentId ? "Save and continue" : "Create draft"}
              </Button>
            )}
          </footer>
        </section>

        <aside className="hidden xl:sticky xl:top-24 xl:block">
          <PreviewPanel form={form} gameName={gameName} bannerUrl={bannerPreview ?? detail?.banner ?? null} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this draft?"
        description="It's removed for good. Nobody else has seen it."
        confirmLabel="Delete draft"
        pending={saving}
        onConfirm={() => void remove()}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
