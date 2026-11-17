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
import { useCreateLadderDraft, useLadder, useLadderHostingOptions, usePublishLadder, useSaveLadderDraft } from "../hooks";
import {
  LADDER_STEPS,
  datesAndPrizePayload,
  emptyLadderDraft,
  ladderDraftFromDetail,
  validateLadderStep,
  type LadderDraftForm,
  type LadderFormErrors,
  type LadderStep,
} from "./draft";
import { AccessStep, CompetitionStep, IdentityStep, ReviewStep } from "./LadderSteps";

const hints: Record<LadderStep, string> = {
  basics: "Host, game and what players see first",
  competition: "Entrants, table, scoring and rules",
  access: "Who can join, the season and the prize",
  review: "Check everything and publish",
};

export function CreateLadderPage() {
  const { ladderId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const hosting = useLadderHostingOptions();
  const existing = useLadder(ladderId);
  const createDraft = useCreateLadderDraft();
  const saveDraft = useSaveLadderDraft(ladderId);
  const publishDraft = usePublishLadder(ladderId);
  const [form, setForm] = useState<LadderDraftForm | null>(null);
  const [errors, setErrors] = useState<LadderFormErrors>({});
  const [serverError, setServerError] = useState("");
  const initialised = useRef(false);
  const game = useGame(form?.basics.gameId || undefined);

  const requested = params.get("step") as LadderStep | null;
  const step: LadderStep = LADDER_STEPS.some((item) => item.key === requested) ? requested! : "basics";
  const stepIndex = LADDER_STEPS.findIndex((item) => item.key === step);

  useEffect(() => {
    if (initialised.current) return;
    if (ladderId && existing.data) {
      setForm(ladderDraftFromDetail(existing.data));
      initialised.current = true;
    } else if (!ladderId && hosting.data) {
      setForm(emptyLadderDraft(hosting.data.user.id));
      initialised.current = true;
    }
  }, [existing.data, hosting.data, ladderId]);

  const update = useCallback(<K extends keyof LadderDraftForm>(section: K, patch: Partial<LadderDraftForm[K]>) => {
    setForm((current) => (current ? { ...current, [section]: { ...current[section], ...patch } } : current));
    setErrors({});
    setServerError("");
  }, []);

  const goTo = (next: LadderStep) => {
    setErrors({});
    setServerError("");
    setParams(next === "basics" ? {} : { step: next });
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const pending = createDraft.isPending || saveDraft.isPending || publishDraft.isPending;

  const saveStep = async () => {
    if (!form || step === "review") return;
    const stepErrors = validateLadderStep(step, form);
    if (Object.keys(stepErrors).length) return setErrors(stepErrors);
    setServerError("");
    const basics = { ...form.basics, hostId: form.basics.hostType === "user" ? undefined : form.basics.hostId };
    try {
      let id = ladderId;
      if (!id) id = (await createDraft.mutateAsync(basics)).id;
      else if (step === "basics") await saveDraft.mutateAsync({ basics });
      else if (step === "competition") await saveDraft.mutateAsync({ format: form.format, rules: form.rules });
      else if (step === "access") await saveDraft.mutateAsync({ joining: form.joining, datesAndPrize: datesAndPrizePayload(form) });
      const next = LADDER_STEPS[stepIndex + 1].key;
      if (!ladderId) navigate(`/ladders/${id}/edit?step=${next}`, { replace: true });
      else goTo(next);
    } catch (error) {
      setServerError(getApiErrorMessage(error, "This step couldn't be saved."));
    }
  };

  const publish = async () => {
    if (!form || !ladderId) return;
    const problems = validateLadderStep("review", form);
    if (Object.keys(problems).length) {
      setErrors(problems);
      setServerError("Some steps still need attention.");
      return;
    }
    try {
      await saveDraft.mutateAsync({ joining: form.joining, datesAndPrize: datesAndPrizePayload(form) });
      await publishDraft.mutateAsync();
      toast.success("Ladder published", "Players can join now.");
      navigate(`/ladders/${ladderId}`, { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "The ladder couldn't be published."));
    }
  };

  if (hosting.isError || existing.isError)
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="This ladder didn't load"
        description={getApiErrorMessage(existing.error ?? hosting.error, "Try again in a moment.")}
        action={
          <LinkButton to="/ladders" tone="outline" size="sm" icon="arrowLeft">
            Back to ladders
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
  if (!ladderId && !hosting.data.canCreateUserOrTeamLadder && !hosting.data.hubs.length)
    return (
      <StatePanel
        icon="ladders"
        title="You're at your ladder limit"
        description={`You have ${hosting.data.activeUserLadders} of ${hosting.data.activeUserLadderLimit} active personal or team ladders. Finish one, or host from a hub.`}
        action={
          <LinkButton to="/ladders" tone="outline" size="sm" icon="arrowLeft">
            Back to ladders
          </LinkButton>
        }
      />
    );

  const hosts = [hosting.data.user, ...hosting.data.teams, ...hosting.data.hubs];
  const hostName = hosts.find((host) => host.type === form.basics.hostType && (host.type === "user" || host.id === form.basics.hostId))?.name ?? "You";
  const published = Boolean(existing.data && existing.data.status !== "draft");

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <header className="grid gap-4">
        <Link to={ladderId && published ? `/ladders/${ladderId}` : "/ladders"} className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 hover:text-mist-50">
          <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
          {published ? "Back to ladder" : "Ladders"}
        </Link>
        <div>
          <h1 className="type-display text-heading">{published ? existing.data?.name : form.basics.name || "Start a ladder"}</h1>
          <p className="mt-3 text-[0.95rem] text-mist-400">
            {pending ? "Saving…" : published ? "Changes reach everyone on the ladder." : "Your draft saves after every step. Only you can see it until you publish."}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
        <nav aria-label="Steps" className="lg:sticky lg:top-24">
          <ol className="relative -mx-1 flex gap-1 overflow-x-auto px-1 scrollbar-none lg:mx-0 lg:grid lg:grid-cols-[minmax(0,1fr)] lg:px-0">
            {LADDER_STEPS.map((item, index) => (
              <li key={item.key} className="shrink-0">
                <button
                  type="button"
                  disabled={!ladderId && index > 0}
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

        <section aria-labelledby="ladder-step" className="overflow-hidden rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6">
          <header className="border-b border-white/6 px-5 py-5 sm:px-7">
            <p className="type-label text-mist-500">
              Step {stepIndex + 1} of {LADDER_STEPS.length}
            </p>
            <h2 id="ladder-step" className="mt-2 text-xl font-semibold">
              {LADDER_STEPS[stepIndex].label}
            </h2>
            <p className="mt-1 text-sm text-mist-400">{hints[step]}</p>
          </header>
          <div className="px-5 py-6 sm:px-7 sm:py-7">
            <fieldset disabled={pending} className="min-w-0">
              {step === "basics" ? (
                <IdentityStep form={form} errors={errors} update={update} hosting={hosting.data} />
              ) : step === "competition" ? (
                <CompetitionStep form={form} errors={errors} update={update} />
              ) : step === "access" ? (
                <AccessStep form={form} errors={errors} update={update} hubHost={form.basics.hostType === "hub"} />
              ) : (
                <ReviewStep form={form} gameName={game.data?.name ?? existing.data?.game.name ?? ""} hostName={hostName} onEdit={goTo} />
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
              <Button tone="ghost" size="sm" icon="arrowLeft" disabled={pending} onClick={() => goTo(LADDER_STEPS[stepIndex - 1].key)}>
                Back
              </Button>
            )}
            <span className="flex-1" />
            {step === "review" ? (
              published ? (
                <LinkButton to={`/ladders/${ladderId}`} size="sm" icon="check">
                  Done
                </LinkButton>
              ) : (
                <Button size="sm" icon="ladders" disabled={pending} onClick={() => void publish()}>
                  {pending ? "Publishing…" : "Publish ladder"}
                </Button>
              )
            ) : (
              <Button size="sm" icon="arrowRight" disabled={pending} onClick={() => void saveStep()}>
                {pending ? "Saving…" : ladderId ? "Save and continue" : "Create draft"}
              </Button>
            )}
          </footer>
        </section>
      </div>
    </div>
  );
}
