import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { useAuthStore } from "@/features/auth/authStore";
import { useOwnedTeams } from "@/features/communities/hooks";
import { useCreateConversation } from "@/features/messages/hooks";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { ChallengeLineups } from "./components/ChallengeLineups";
import { ChallengeTimeline } from "./components/ChallengeTimeline";
import { ReportDialog } from "./components/ReportDialog";
import { RescheduleDialog } from "./components/RescheduleDialog";
import { ScoreDialog } from "./components/ScoreDialog";
import { VersusStage } from "./components/VersusStage";
import {
  useChallenge,
  useDeleteChallenge,
  useEligibleLineupMembers,
  useProposeReschedule,
  useRefreshChallenge,
  useRespondReschedule,
  useUpdateChallenge,
  useUpdateTeamChallengeLineup,
} from "./hooks";
import {
  canCancel,
  canDelete,
  canPropose,
  canSubmitScore,
  challengePerspective,
  challengeTimeline,
  formatChallengeDateTime,
  isTournamentChallenge,
  lineupsReady,
  nextStep,
  tournamentMatchLink,
} from "./lifecycle";

type Overlay = "score" | "reschedule" | "report" | "cancel" | "delete" | null;

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="type-label text-mist-500">{label}</dt>
      <dd className="mt-2 truncate text-sm font-semibold">{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-6">
      <Skeleton className="h-4 w-28 rounded-full" />
      <Skeleton className="h-72 rounded-panel" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-48 rounded-card" />
        <Skeleton className="h-56 rounded-card" />
      </div>
    </div>
  );
}

export function ChallengeDetailPage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { owned } = useOwnedTeams(user?.id);
  const ownedTeamIds = useMemo(() => owned.map((team) => team.id), [owned]);
  const query = useChallenge(challengeId);
  const update = useUpdateChallenge();
  const refresh = useRefreshChallenge();
  const propose = useProposeReschedule();
  const respond = useRespondReschedule();
  const remove = useDeleteChallenge();
  const saveLineup = useUpdateTeamChallengeLineup();
  const conversation = useCreateConversation();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [reported, setReported] = useState(false);
  const [editingLineup, setEditingLineup] = useState(false);
  const [lineup, setLineup] = useState<string[]>([]);

  const challenge = query.data;
  const view = challenge ? challengePerspective(challenge, user?.id, ownedTeamIds) : null;
  const ownLineup = useMemo(
    () => (challenge?.lineups ?? []).filter((member) => member.teamId === view?.ownTeamId).map((member) => member.playerId),
    [challenge?.lineups, view?.ownTeamId],
  );
  const opposingLineup = useMemo(
    () => (challenge?.lineups ?? []).filter((member) => member.teamId !== view?.ownTeamId).map((member) => member.playerId),
    [challenge?.lineups, view?.ownTeamId],
  );
  useEffect(() => setLineup(ownLineup), [ownLineup]);

  const answeringWithLineup = Boolean(challenge?.type === "team" && challenge.status === "pending" && view?.incoming);
  const lineupLocked = Boolean(challenge?.lineupLockAt && new Date(challenge.lineupLockAt).getTime() <= Date.now());
  const canEditLineup = Boolean(
    challenge?.type === "team" &&
      challenge.lineupRequired !== false &&
      view?.ownTeamId &&
      ["pending", "accepted", "reschedule_pending"].includes(challenge.status) &&
      !lineupLocked,
  );
  const eligible = useEligibleLineupMembers(view?.ownTeamId, canEditLineup && (editingLineup || answeringWithLineup));

  if (query.isLoading) return <DetailSkeleton />;
  if (query.isError || !challenge || !view) {
    return (
      <StatePanel
        icon="warning"
        tone="danger"
        title="This challenge isn't available"
        description={getApiErrorMessage(query.error, "It may have been deleted, or you might not be part of it.")}
        action={
          <LinkButton to="/challenges" tone="outline" size="sm" icon="arrowLeft">
            Back to challenges
          </LinkButton>
        }
      />
    );
  }

  const step = nextStep(challenge, view, user?.id);
  const tournament = isTournamentChallenge(challenge);
  const ready = lineupsReady(challenge);
  const required = challenge.teamSize ?? 0;
  const lineupConflict = lineup.some((id) => opposingLineup.includes(id));
  const proposedByMe = challenge.reschedule?.proposedBy === user?.id;
  const opponentId =
    challenge.type === "user"
      ? view.side === "challenger"
        ? challenge.challengedId
        : challenge.challengerId
      : undefined;
  const actionError = update.error || refresh.error || propose.error || respond.error || remove.error || saveLineup.error;

  const answer = (status: "accepted" | "rejected") =>
    update.mutate({
      id: challenge.id,
      type: challenge.type,
      updates: { status, ...(status === "accepted" && challenge.type === "team" ? { lineupPlayerIds: lineup } : {}) },
    });

  const reschedule = async (scheduledDate: string) => {
    const mutation = challenge.status === "expired" ? refresh : propose;
    await mutation.mutateAsync({ id: challenge.id, type: challenge.type, scheduledDate });
    setOverlay(null);
  };

  const message = async () => {
    if (!user || !opponentId) return;
    const opponent = view.opponentName;
    const created = await conversation.mutateAsync({ participantIds: [user.id, opponentId], type: "user", name: opponent });
    navigate(`/messages?conversation=${created.id}`);
  };

  const primary: ReactNode[] = [];
  const secondary: ReactNode[] = [];

  if (tournament) {
    const link = tournamentMatchLink(challenge);
    if (link)
      primary.push(
        <LinkButton key="tournament" to={link} icon="arrowRight" className="w-full">
          Open match
        </LinkButton>,
      );
  } else {
    if (challenge.status === "pending" && view.incoming) {
      primary.push(
        <Button
          key="accept"
          className="w-full"
          disabled={update.isPending || (challenge.type === "team" && (lineup.length !== required || lineupConflict))}
          onClick={() => answer("accepted")}
        >
          {update.isPending ? "Updating…" : "Accept challenge"}
        </Button>,
        <Button key="decline" tone="outline" className="w-full" disabled={update.isPending} onClick={() => answer("rejected")}>
          Decline
        </Button>,
      );
    }
    if (canSubmitScore(challenge) && view.participant && ready) {
      primary.push(
        <Button key="score" icon="trophy" className="w-full" onClick={() => setOverlay("score")}>
          Submit score
        </Button>,
      );
    }
    if (challenge.status === "reschedule_pending" && view.participant && !proposedByMe) {
      primary.push(
        <Button
          key="accept-time"
          className="w-full"
          disabled={respond.isPending}
          onClick={() => respond.mutate({ id: challenge.id, type: challenge.type, accept: true })}
        >
          {respond.isPending ? "Updating…" : "Accept new time"}
        </Button>,
        <Button
          key="keep-time"
          tone="outline"
          className="w-full"
          disabled={respond.isPending}
          onClick={() => respond.mutate({ id: challenge.id, type: challenge.type, accept: false })}
        >
          Keep current time
        </Button>,
      );
    }
    if ((canPropose(challenge) || challenge.status === "expired") && view.participant) {
      primary.push(
        <Button
          key="reschedule"
          tone={primary.length ? "outline" : "lavender"}
          icon={challenge.status === "expired" ? "refresh" : "clock"}
          className="w-full"
          onClick={() => setOverlay("reschedule")}
        >
          {challenge.status === "expired" ? "Send again" : "Propose new time"}
        </Button>,
      );
    }
    if (challenge.status === "completed" && view.participant) {
      secondary.push(
        <button
          key="report"
          type="button"
          disabled={reported}
          onClick={() => setOverlay("report")}
          className="flex items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-mist-50 disabled:text-mist-500"
        >
          <Icon name="flag" className="size-4" />
          {reported ? "Result reported" : "Report this result"}
        </button>,
      );
    }
    if (canCancel(challenge.status) && view.participant) {
      secondary.push(
        <button
          key="cancel"
          type="button"
          onClick={() => setOverlay("cancel")}
          className="flex items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-danger"
        >
          <Icon name="prohibit" className="size-4" />
          Cancel challenge
        </button>,
      );
    }
    if (view.initiated && canDelete(challenge.status)) {
      secondary.push(
        <button
          key="delete"
          type="button"
          onClick={() => setOverlay("delete")}
          className="flex items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-danger"
        >
          <Icon name="trash" className="size-4" />
          Delete challenge
        </button>,
      );
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Link
        to="/challenges"
        className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-mist-50"
      >
        <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Challenges
      </Link>

      <VersusStage challenge={challenge} view={view} tone={step.tone} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="grid gap-6">
          {!tournament && (
            <section className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
              <ChallengeTimeline steps={challengeTimeline(challenge)} />
            </section>
          )}

          <section className="rounded-card bg-ink-900/60 p-5 ring-1 ring-inset ring-white/6 sm:p-6">
            <h2 className="text-base font-semibold">Terms</h2>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              <Detail label="Game">{challenge.game}</Detail>
              <Detail label="Format">{challenge.format}</Detail>
              {challenge.teamSize ? (
                <Detail label="Team size">
                  {challenge.teamSize}v{challenge.teamSize}
                </Detail>
              ) : (
                <Detail label="Type">{challenge.type === "team" ? "Team" : "Player"}</Detail>
              )}
              <Detail label="Sent">
                {challenge.createdAt
                  ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(challenge.createdAt))
                  : "Not recorded"}
              </Detail>
            </dl>
            {challenge.message && (
              <blockquote className="mt-6 border-l-2 border-lavender-400/50 pl-4 text-[0.95rem] leading-relaxed text-mist-200">
                {challenge.message}
              </blockquote>
            )}
            {challenge.result?.notes && (
              <p className="mt-6 text-sm leading-relaxed text-mist-400">
                <span className="font-medium text-mist-200">Result notes. </span>
                {challenge.result.notes}
              </p>
            )}
          </section>

          {challenge.type === "team" && (
            <ChallengeLineups
              challenge={challenge}
              locked={lineupLocked}
              ready={ready}
              onEdit={canEditLineup && !answeringWithLineup ? () => setEditingLineup(true) : undefined}
              editor={
                canEditLineup && (editingLineup || answeringWithLineup)
                  ? {
                      members: eligible.data ?? [],
                      loading: eligible.isLoading,
                      selected: lineup,
                      unavailable: opposingLineup,
                      onChange: setLineup,
                      save: answeringWithLineup
                        ? undefined
                        : {
                            pending: saveLineup.isPending,
                            onCancel: () => {
                              setLineup(ownLineup);
                              setEditingLineup(false);
                            },
                            onSave: () =>
                              view.ownTeamId &&
                              saveLineup.mutate(
                                { challengeId: challenge.id, teamId: view.ownTeamId, playerIds: lineup },
                                { onSuccess: () => setEditingLineup(false) },
                              ),
                          },
                    }
                  : undefined
              }
            />
          )}
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-24">
          <section
            aria-labelledby="next-step"
            className={cn(
              "rounded-card p-5 ring-1 ring-inset sm:p-6",
              step.tone === "action" ? "bg-lavender-400/7 ring-lavender-400/30" : "bg-ink-900/60 ring-white/6",
            )}
          >
            <p className="type-label text-mist-500">{view.participant ? "Your next step" : "Status"}</p>
            <h2 id="next-step" className="mt-3 text-lg font-semibold">
              {step.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-mist-400">{step.description}</p>

            {challenge.status === "reschedule_pending" && challenge.reschedule && (
              <p className="mt-4 rounded-2xl bg-white/4 px-4 py-3 text-sm ring-1 ring-inset ring-white/8">
                <span className="block text-mist-500">Proposed time</span>
                <span className="mt-0.5 block font-semibold">
                  {formatChallengeDateTime(challenge.reschedule.proposedDate)}
                </span>
              </p>
            )}
            {answeringWithLineup && lineup.length !== required && (
              <p className="mt-4 text-sm text-mist-300">Pick {required} players in Lineups to accept.</p>
            )}
            {answeringWithLineup && lineupConflict && (
              <p className="mt-4 text-sm text-danger">One of your picks is already in the other team's lineup.</p>
            )}

            {primary.length > 0 && <div className="mt-5 grid gap-2">{primary}</div>}

            {opponentId && view.participant && (
              <Button
                tone="ghost"
                size="sm"
                icon="messages"
                className="mt-3 w-full"
                disabled={conversation.isPending}
                onClick={() => void message()}
              >
                Message {view.opponentName}
              </Button>
            )}

            {actionError && (
              <p role="alert" className="mt-4 text-sm text-danger">
                {getApiErrorMessage(actionError, "That didn't go through. Try again.")}
              </p>
            )}
          </section>

          {secondary.length > 0 && <div className="grid gap-3 px-2">{secondary}</div>}
        </aside>
      </div>

      <ScoreDialog challenge={challenge} open={overlay === "score"} onClose={() => setOverlay(null)} />
      <ReportDialog
        challenge={challenge}
        open={overlay === "report"}
        onClose={() => setOverlay(null)}
        onReported={() => {
          setReported(true);
          setOverlay(null);
        }}
      />
      {overlay === "reschedule" && (
        <RescheduleDialog
          open
          mode={challenge.status === "expired" ? "refresh" : "propose"}
          opponent={view.opponentName}
          pending={refresh.isPending || propose.isPending}
          error={
            refresh.error || propose.error
              ? getApiErrorMessage(refresh.error || propose.error, "The new time couldn't be sent.")
              : undefined
          }
          onSubmit={(iso) => void reschedule(iso).catch(() => undefined)}
          onClose={() => setOverlay(null)}
        />
      )}
      <ConfirmDialog
        open={overlay === "cancel"}
        title="Cancel this challenge?"
        description={`${view.opponentName} will be told it's off. This can't be undone.`}
        confirmLabel="Cancel challenge"
        pending={update.isPending}
        error={update.isError ? getApiErrorMessage(update.error, "It couldn't be cancelled.") : undefined}
        onConfirm={() =>
          update.mutate(
            { id: challenge.id, type: challenge.type, updates: { status: "cancelled" } },
            { onSuccess: () => setOverlay(null) },
          )
        }
        onClose={() => setOverlay(null)}
      />
      <ConfirmDialog
        open={overlay === "delete"}
        title="Delete this challenge?"
        description="It's removed for both sides, with its history. This can't be undone."
        confirmLabel="Delete challenge"
        pending={remove.isPending}
        error={remove.isError ? getApiErrorMessage(remove.error, "It couldn't be deleted.") : undefined}
        onConfirm={() =>
          remove.mutate(
            { id: challenge.id, type: challenge.type },
            { onSuccess: () => navigate("/challenges", { replace: true }) },
          )
        }
        onClose={() => setOverlay(null)}
      />
    </div>
  );
}
