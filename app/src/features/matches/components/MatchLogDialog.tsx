import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { inputClasses, TextAreaField, TextField } from "@/components/ui/Field";
import { FileDrop } from "@/components/ui/FileDrop";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { OptionCards } from "@/components/ui/OptionCards";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/features/auth/authStore";
import { useGameFacets } from "@/features/games/hooks";
import { usePlayerProfile } from "@/features/profile/hooks";
import type { ProfileGame } from "@/features/profile/types";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { recordPlayerCardShare, uploadMatchEvidence } from "../api";
import { useConfirmMatchSubmission, useMatchEvidence, useMatchSubmission, useProcessMatchSubmission, useReviewMatchSubmission } from "../hooks";
import type { ConfirmedMatch, MatchInterpretation, MatchReviewInput, MatchSubmission } from "../types";
import { VERIFIABLE_ADAPTERS } from "../verification";

const MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACTIVE_KEY = "Gamerie_active_match_submission";

const localDateTime = (date = new Date()) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

function storage(action: "get" | "set" | "remove", key: string, value = "") {
  try {
    if (action === "get") return sessionStorage.getItem(key);
    if (action === "set") sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // Resuming an upload is a convenience; storage can be unavailable.
  }
  return null;
}

function verifiableGames(games: ProfileGame[]) {
  const seen = new Set<string>();
  return games.flatMap((entry) => {
    const adapter = String(entry.matchVerificationAdapter || entry.game?.matchVerificationAdapter || "");
    const id = String(entry.gameId || entry.game?.id || entry.id || "");
    if (!VERIFIABLE_ADAPTERS.has(adapter) || !id || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name: String(entry.game?.name || entry.name || "Game"), adapter }];
  });
}

function Steps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol aria-label="Steps" className="mb-6 grid grid-cols-3 gap-2">
      {["Upload", "Review", "Recorded"].map((label, index) => (
        <li key={label} aria-current={index === current ? "step" : undefined} className="grid gap-2">
          <span className={cn("h-1 rounded-full", index <= current ? "bg-lavender-400" : "bg-white/8")} />
          <span className={cn("type-label", index === current ? "text-mist-100" : "text-mist-500")}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function Status({ icon, title, text, busy, children }: { icon: "spinner" | "warning" | "check"; title: string; text: string; busy?: boolean; children?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-3 py-8 text-center" role={busy ? "status" : undefined}>
      <span className={cn("grid size-12 place-items-center rounded-full", icon === "warning" ? "bg-danger/10 text-danger" : "bg-lavender-400/12 text-lavender-300")}>
        <Icon name={icon} className={cn("size-5", busy && "animate-spin")} />
      </span>
      <p className="font-semibold">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-mist-400">{text}</p>
      {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

function Upload({ onUploaded, onBusy }: { onUploaded: (submission: MatchSubmission) => Promise<void>; onBusy: (busy: boolean) => void }) {
  const user = useAuthStore((state) => state.user);
  const [params] = useSearchParams();
  const profile = usePlayerProfile(user?.username ?? user?.id);
  const catalogue = useGameFacets();
  const games = useMemo(() => verifiableGames(profile.data?.gamesPlayed?.length ? profile.data.gamesPlayed : (profile.data?.games ?? [])), [profile.data]);
  const supportedTitles = useMemo(
    () => (catalogue.data?.data ?? []).filter((game) => VERIFIABLE_ADAPTERS.has(String(game.matchVerificationAdapter ?? ""))).map((game) => game.name),
    [catalogue.data],
  );
  const requested = params.get("game");
  const [gameId, setGameId] = useState("");
  const chosen = gameId || (games.some((game) => game.id === requested) ? requested! : games.length === 1 ? games[0].id : "");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => onBusy(busy), [busy, onBusy]);
  useEffect(() => () => onBusy(false), [onBusy]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!chosen || !file) return setError("Pick the game and add the result screenshot.");
    // The same file for the same game reuses its key, so a retried upload can't create a second submission.
    const fileKey = `Gamerie_match_upload:${chosen}:${file.name}:${file.size}:${file.lastModified}`;
    const idempotencyKey = storage("get", fileKey) ?? crypto.randomUUID();
    storage("set", fileKey, idempotencyKey);
    setError("");
    setBusy(true);
    try {
      const created = await uploadMatchEvidence(chosen, file, idempotencyKey, setProgress);
      storage("remove", fileKey);
      await onUploaded(created);
    } catch (reason) {
      setError(getApiErrorMessage(reason, "The screenshot didn't upload. Try again."));
      setBusy(false);
    }
  };

  if (profile.isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!games.length)
    return (
      <div className="grid gap-5">
        <Notice title="Add a game that supports screenshots">
          Gamerie reads result screens for {supportedTitles.length ? supportedTitles.join(", ") : "selected games"}. Add one to your games with your in-game name, then log a match here.
        </Notice>
        <p className="text-sm leading-relaxed text-mist-400">Challenge and tournament results go on your record automatically, so you never need to log those.</p>
        <div>
          <LinkButton to={`/profile/${encodeURIComponent(user?.username ?? user?.id ?? "")}?tab=games`} size="sm" icon="plus">
            Add a game
          </LinkButton>
        </div>
      </div>
    );

  return (
    <form id="match-upload" onSubmit={submit} className="grid gap-6" noValidate>
      {games.length > 1 ? (
        <OptionCards legend="Game" columns={games.length > 2 ? 3 : 2} value={chosen} onChange={setGameId} options={games.map((game) => ({ value: game.id, label: game.name, icon: "games" }))} />
      ) : (
        <div className="grid gap-2">
          <span className="text-sm font-medium text-mist-200">Game</span>
          <p className="flex h-12 items-center gap-2.5 rounded-2xl bg-white/4 px-4 text-sm text-mist-100 ring-1 ring-inset ring-white/10">
            <Icon name="games" className="size-4 text-lavender-300" />
            {games[0].name}
          </p>
        </div>
      )}
      <FileDrop
        label="Result screenshot"
        hint="JPG, PNG or WebP, up to 8 MB"
        accept={IMAGE_TYPES}
        maxBytes={MAX_BYTES}
        file={file}
        onFile={setFile}
        disabled={busy}
      />
      <p className="-mt-3 text-xs leading-relaxed text-mist-500">
        Use the final result screen with your in-game name on it, not a menu or stats page. It stays private and is never posted.
      </p>
      {busy && (
        <div className="grid gap-2" role="status">
          <div className="flex justify-between text-xs text-mist-400">
            <span>{progress < 100 ? "Uploading" : "Reading your result"}</span>
            <span className="tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-lavender-400 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
    </form>
  );
}

type ReviewValues = { playerScore: string; opponentScore: string; opponent: string; playedAt: string; note: string };

function reviewError(values: ReviewValues, read: MatchInterpretation | null, result: "victory" | "defeat", corrected: boolean) {
  const hasPlayer = values.playerScore !== "";
  const hasOpponent = values.opponentScore !== "";
  if (hasPlayer !== hasOpponent) return "Add both scores, or leave both empty.";
  if (hasPlayer) {
    const mine = Number(values.playerScore);
    const theirs = Number(values.opponentScore);
    if (mine === theirs) return "Scores can't be level for a win or a loss.";
    if (result === "victory" && mine < theirs) return "For a win, your score needs to be higher.";
    if (result === "defeat" && mine > theirs) return "For a loss, your score needs to be lower.";
  }
  if (!values.playedAt) return "Add when the match was played.";
  if (new Date(values.playedAt).getTime() > Date.now() + 5 * 60_000) return "The match can't be in the future.";
  if (corrected && !values.note.trim()) return "Say what you changed from what Gamerie read.";
  if (!read?.result) return "This screenshot has no result to record.";
  return "";
}

function Review({ submission, adapter, onRecorded, onRestart, onBusy }: { submission: MatchSubmission; adapter?: string; onRecorded: (confirmed: ConfirmedMatch) => void; onRestart: () => void; onBusy: (busy: boolean) => void }) {
  const read = submission.interpretation;
  const saved = submission.reviewedMatch;
  const result = saved?.result ?? read?.result ?? "victory";
  const evidence = useMatchEvidence(submission.id);
  const review = useReviewMatchSubmission(submission.id);
  const confirm = useConfirmMatchSubmission(submission.id);
  const evidenceUrl = useMemo(() => (evidence.data ? URL.createObjectURL(evidence.data) : null), [evidence.data]);
  useEffect(() => () => void (evidenceUrl && URL.revokeObjectURL(evidenceUrl)), [evidenceUrl]);
  const [values, setValues] = useState<ReviewValues>(() => ({
    playerScore: String(saved?.playerScore ?? read?.playerScore ?? ""),
    opponentScore: String(saved?.opponentScore ?? read?.opponentScore ?? ""),
    opponent: saved?.opponentIdentity ?? "",
    playedAt: localDateTime(saved ? new Date(saved.playedAt) : new Date()),
    note: saved?.correctionReason ?? "",
  }));
  const [error, setError] = useState("");
  const scored = adapter !== "bgmi";
  const asNumber = (value: string) => (value === "" ? null : Number(value));
  // Mirrors the API: changed scores or a named opponent count as corrections and need a note.
  const corrected = asNumber(values.playerScore) !== (read?.playerScore ?? null) || asNumber(values.opponentScore) !== (read?.opponentScore ?? null) || Boolean(values.opponent.trim());
  const set = (key: keyof ReviewValues) => (event: { target: { value: string } }) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const pending = review.isPending || confirm.isPending;
  useEffect(() => onBusy(pending), [pending, onBusy]);
  useEffect(() => () => onBusy(false), [onBusy]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const problem = reviewError(values, read, result, corrected);
    if (problem) return setError(problem);
    setError("");
    const input: MatchReviewInput = {
      result,
      playedAt: new Date(values.playedAt).toISOString(),
      opponentIdentity: values.opponent.trim() || undefined,
      correctionReason: corrected ? values.note.trim() : undefined,
      ...(values.playerScore !== "" ? { playerScore: Number(values.playerScore), opponentScore: Number(values.opponentScore) } : {}),
    };
    try {
      await review.mutateAsync(input);
      onRecorded(await confirm.mutateAsync());
    } catch (reason) {
      setError(getApiErrorMessage(reason, "The match wasn't recorded. Try again."));
    }
  };

  return (
    <form id="match-review" onSubmit={submit} className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]" noValidate>
      <div className="grid content-start gap-3">
        <div className="grid aspect-video place-items-center overflow-hidden rounded-2xl bg-ink-950 ring-1 ring-inset ring-white/8">
          {evidenceUrl ? <img src={evidenceUrl} alt="Your result screenshot" className="size-full object-contain" /> : <Skeleton className="size-full" />}
        </div>
        <div className={cn("flex items-center gap-3 rounded-2xl p-3.5 ring-1 ring-inset", result === "victory" ? "bg-signal/8 ring-signal/20" : "bg-white/4 ring-white/8")}>
          <span className={cn("grid size-10 place-items-center rounded-xl text-sm font-bold", result === "victory" ? "bg-signal/14 text-signal" : "bg-white/8 text-mist-300")}>{result === "victory" ? "W" : "L"}</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{result === "victory" ? "Win" : "Loss"}, read from your screenshot</span>
            <span className="block text-xs text-mist-400">
              Wrong?{" "}
              <button type="button" onClick={onRestart} className="font-medium text-lavender-300 hover:text-lavender-200">
                Use another screenshot
              </button>
            </span>
          </span>
        </div>
      </div>
      <div className="grid content-start gap-4">
        {scored && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <TextField id="match-player-score" label="Your score" type="number" inputMode="numeric" min={0} max={999} value={values.playerScore} onChange={set("playerScore")} />
              <TextField id="match-opponent-score" label="Their score" type="number" inputMode="numeric" min={0} max={999} value={values.opponentScore} onChange={set("opponentScore")} />
            </div>
            <TextField id="match-opponent" label="Opponent (optional)" maxLength={160} value={values.opponent} onChange={set("opponent")} />
          </>
        )}
        <label className="grid gap-2">
          <span className="text-sm font-medium text-mist-200">Played</span>
          <input type="datetime-local" max={localDateTime()} value={values.playedAt} onChange={set("playedAt")} className={cn(inputClasses, "scheme-dark")} />
        </label>
        {corrected && <TextAreaField id="match-note" label="What did you change?" rows={2} maxLength={500} value={values.note} onChange={set("note")} placeholder="For example: the score was cut off in the screenshot" />}
        {error && <Notice tone="danger">{error}</Notice>}
        <p className="text-xs text-mist-500">Nothing goes on your record until you confirm.</p>
      </div>
    </form>
  );
}

function Recorded({ confirmed }: { confirmed: ConfirmedMatch }) {
  const user = useAuthStore((state) => state.user);
  const { progression, streak, sharePrompt, match, matchCount } = confirmed;
  const [shared, setShared] = useState<"" | "shared" | "copied" | "error">("");
  const share = async () => {
    if (!sharePrompt || !user?.username) return;
    const url = `${window.location.origin}/card/${encodeURIComponent(user.username)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${user.username} on Gamerie`, text: sharePrompt.message, url });
        setShared("shared");
        void recordPlayerCardShare(match.id, sharePrompt.reason, "native_share").catch(() => undefined);
      } else {
        await navigator.clipboard.writeText(url);
        setShared("copied");
        void recordPlayerCardShare(match.id, sharePrompt.reason, "link_copy").catch(() => undefined);
      }
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === "AbortError")) setShared("error");
    }
  };
  const facts: Array<[string, string, boolean?]> = [
    ["Earned", `+${progression.gpAwarded} GP`, true],
    ["Total", `${progression.totalGp.toLocaleString()} GP`],
    ["Level", String(progression.level), progression.levelReached],
    ["Matches", String(matchCount)],
  ];

  return (
    <div className="grid gap-6">
      <div className="grid justify-items-center gap-2 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-signal/12 text-signal ring-1 ring-inset ring-signal/25">
          <Icon name="check" className="size-6" weight="bold" />
        </span>
        <p className="mt-2 text-lg font-semibold">{progression.levelReached ? `Level ${progression.level} reached` : "Match recorded"}</p>
        <p className="text-sm text-mist-400">Your record, GP and streak are up to date.</p>
      </div>
      <dl className="grid grid-cols-2 overflow-hidden rounded-2xl ring-1 ring-inset ring-white/8 sm:grid-cols-4">
        {facts.map(([label, value, highlight], index) => (
          <div key={label} className={cn("border-white/8 px-4 py-3.5", index % 2 && "border-l", index > 1 && "border-t sm:border-t-0", index === 2 && "sm:border-l")}>
            <dt className="type-label text-mist-500">{label}</dt>
            <dd className={cn("mt-1 font-semibold tabular-nums", highlight && "text-signal")}>{value}</dd>
          </div>
        ))}
      </dl>
      {progression.nextLevel && progression.gpForNextLevel != null && (
        <div className="grid gap-2">
          <div className="flex justify-between text-xs text-mist-400">
            <span>
              Level {progression.level} to {progression.nextLevel}
            </span>
            <span className="tabular-nums">
              {progression.gpIntoLevel} / {progression.gpForNextLevel} GP
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-lavender-400" style={{ width: `${Math.min(100, Math.max(0, progression.progressPercent))}%` }} />
          </div>
        </div>
      )}
      {streak.currentStreak > 0 && (
        <p className="flex items-center gap-2 text-sm text-mist-300">
          <Icon name="bolt" className="size-4 text-lavender-300" />
          {streak.currentStreak}-day match streak{streak.longestStreak > streak.currentStreak ? ` · best ${streak.longestStreak}` : streak.currentStreak > 1 ? " · your best yet" : ""}
        </p>
      )}
      {sharePrompt && (
        <div className="flex flex-col gap-3 rounded-2xl bg-lavender-400/8 p-4 ring-1 ring-inset ring-lavender-400/20 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{sharePrompt.title}</p>
            <p className="mt-0.5 text-sm text-mist-300">{sharePrompt.message}</p>
          </div>
          <Button tone="outline" size="sm" icon="share" onClick={() => void share()}>
            {shared === "copied" ? "Link copied" : shared === "shared" ? "Shared" : "Share your card"}
          </Button>
        </div>
      )}
      {shared === "error" && <p className="text-xs text-danger">Sharing didn't work this time.</p>}
    </div>
  );
}

const failures: Record<string, { title: string; text: string }> = {
  duplicate: { title: "This screenshot was already used", text: "Nothing new was recorded. Pick a different result screen." },
  review_required: { title: "We couldn't find your in-game name", text: "Check the name saved on your game, or use a clearer screenshot that shows it." },
  rejected: { title: "That isn't a result screen we can read", text: "Use the final result screen, not a profile, history, menu or stats page." },
  cancelled: { title: "This upload was cancelled", text: "Start again with a result screenshot." },
};

/** Log a match from a result screenshot: upload, check what Gamerie read, then record it. */
export function MatchLogDialog({ onClose }: { onClose: () => void }) {
  const { submissionId } = useParams<{ submissionId?: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const profile = usePlayerProfile(user?.username ?? user?.id);
  const submission = useMatchSubmission(submissionId);
  const process = useProcessMatchSubmission();
  const [confirmed, setConfirmed] = useState<ConfirmedMatch | null>(null);
  const [busy, setBusy] = useState(false);
  // Set by the upload and review steps while a request is in flight.
  const [working, setWorking] = useState(false);
  const current = submission.data;
  const adapter = useMemo(() => {
    const games = verifiableGames(profile.data?.gamesPlayed?.length ? profile.data.gamesPlayed : (profile.data?.games ?? []));
    return games.find((game) => game.id === current?.gameId)?.adapter;
  }, [current?.gameId, profile.data]);

  // Pick an unfinished upload back up after a reload.
  useEffect(() => {
    if (submissionId) return;
    const active = storage("get", ACTIVE_KEY);
    if (active) navigate(`/matches/log/${active}`, { replace: true });
  }, [navigate, submissionId]);
  useEffect(() => {
    if (current && !["uploaded", "processing", "ready_for_review"].includes(current.status)) storage("remove", ACTIVE_KEY);
  }, [current]);

  const restart = () => {
    storage("remove", ACTIVE_KEY);
    setConfirmed(null);
    navigate("/matches/log", { replace: true });
  };
  const uploaded = async (created: MatchSubmission) => {
    storage("set", ACTIVE_KEY, created.id);
    navigate(`/matches/log/${created.id}`, { replace: true });
    await process.mutateAsync(created.id).catch(() => undefined);
  };
  const retry = async () => {
    if (!current) return;
    setBusy(true);
    await process.mutateAsync(current.id).catch(() => undefined);
    setBusy(false);
  };

  const done = confirmed ?? (current?.status === "confirmed" && current.recordedMatch && current.progression && current.streak ? ({ match: current.recordedMatch, progression: current.progression, streak: current.streak, matchCount: current.matchCount ?? 0, sharePrompt: current.sharePrompt } satisfies ConfirmedMatch) : null);
  const step: 0 | 1 | 2 = done ? 2 : current?.status === "ready_for_review" ? 1 : 0;
  const reviewing = !done && current?.status === "ready_for_review";
  const uploading = !submissionId;

  let body: ReactNode;
  if (done) body = <Recorded confirmed={done} />;
  else if (uploading) body = <Upload onUploaded={uploaded} onBusy={setWorking} />;
  else if (submission.isLoading) body = <Skeleton className="h-64 rounded-2xl" />;
  else if (submission.isError || !current)
    body = (
      <Status icon="warning" title="This upload isn't available" text={getApiErrorMessage(submission.error, "It may have expired. Start again with your screenshot.")}>
        <Button size="sm" onClick={restart}>
          Start again
        </Button>
      </Status>
    );
  else if (current.status === "uploaded" || current.status === "processing")
    body = (
      <Status icon="spinner" busy={current.status === "processing" || process.isPending} title="Reading your result" text="This usually takes a few seconds. Retrying never records a match twice.">
        {current.status === "uploaded" && !process.isPending && (
          <Button size="sm" disabled={busy} onClick={() => void retry()}>
            Continue
          </Button>
        )}
      </Status>
    );
  else if (reviewing) body = <Review submission={current} adapter={adapter} onRecorded={setConfirmed} onRestart={restart} onBusy={setWorking} />;
  else if (current.status === "failed")
    body = (
      <Status icon="warning" title="We couldn't read that screenshot" text="Your upload is safe. Try reading it again, or use a clearer screenshot.">
        <Button size="sm" disabled={busy} onClick={() => void retry()}>
          Try again
        </Button>
        <Button tone="ghost" size="sm" onClick={restart}>
          Use another screenshot
        </Button>
      </Status>
    );
  else
    body = (
      <Status icon="warning" title={failures[current.status]?.title ?? "This upload can't be recorded"} text={failures[current.status]?.text ?? "Start again with a result screenshot."}>
        <Button size="sm" onClick={restart}>
          Use another screenshot
        </Button>
      </Status>
    );

  const footer = done ? (
    <>
      <Button tone="ghost" size="sm" icon="plus" onClick={restart}>
        Log another
      </Button>
      <Button size="sm" onClick={onClose}>
        Done
      </Button>
    </>
  ) : uploading ? (
    <>
      <Button tone="ghost" size="sm" disabled={working} onClick={onClose}>
        Cancel
      </Button>
      <Button type="submit" form="match-upload" size="sm" icon="arrowRight" disabled={working}>
        {working ? "Uploading…" : "Read result"}
      </Button>
    </>
  ) : reviewing ? (
    <>
      <Button tone="ghost" size="sm" disabled={working} onClick={onClose}>
        Later
      </Button>
      <Button type="submit" form="match-review" size="sm" icon="check" disabled={working}>
        {working ? "Recording…" : "Record match"}
      </Button>
    </>
  ) : undefined;

  return (
    <Dialog open title="Log a match" description="Upload a result screen, check what Gamerie read, and it goes on your record." icon="camera" size="lg" dismissible={!working} onClose={onClose} footer={footer}>
      <Steps current={step} />
      {body}
    </Dialog>
  );
}
