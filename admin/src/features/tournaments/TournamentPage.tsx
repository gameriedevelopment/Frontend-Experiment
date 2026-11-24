import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, ButtonLink } from "@/components/ui/Button";
import { StatePanel } from "@/components/ui/StatePanel";
import { Panel } from "@/components/layout/Panel";
import { ActivityFeed } from "@/components/record/ActivityFeed";
import { BackLink } from "@/components/record/BackLink";
import { DossierHeader, DossierSkeleton } from "@/components/record/DossierHeader";
import { Facts, Figures } from "@/components/record/Facts";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Stamp } from "@/components/record/Stamp";
import { useBreadcrumb } from "@/app/shell/crumb";
import { EntrantList } from "@/features/competitions/components/EntrantList";
import { StatusStamp } from "@/features/competitions/components/StatusStamp";
import { formatLabel, money } from "@/features/competitions/format";
import { playerAppLink } from "@/lib/env";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime, statusLabel } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useTournament, useTournamentActions, useTournamentActivity, useTournamentEntrants } from "./hooks";

export function TournamentPage() {
  const { tournamentId = "" } = useParams();
  const tournament = useTournament(tournamentId);
  const entrants = useTournamentEntrants(tournamentId);
  const activity = useTournamentActivity(tournamentId);
  const actions = useTournamentActions(tournamentId);
  const [dialog, setDialog] = useState<"cancel" | "remove" | null>(null);
  const t = tournament.data;
  useBreadcrumb(t?.name);
  useDocumentTitle(t?.name ?? "Tournament");

  if (tournament.isLoading) return <DossierSkeleton />;
  if (!t) {
    return (
      <div className="grid gap-6">
        <BackLink to="/tournaments" label="Tournaments" />
        <StatePanel icon="trophy" tone="danger" title="This tournament didn't load" description={getApiErrorMessage(tournament.error, "It may have been deleted.")} />
      </div>
    );
  }

  const removed = Boolean(t.removedAt);
  const running = ["live", "paused", "check_in", "awaiting_start"].includes(t.phase);
  const cancellable = !removed && !["draft", "completed", "cancelled"].includes(t.phase);
  const control = (action: "pause" | "resume") =>
    actions.control.mutate(action, {
      onSuccess: () => toast.success(action === "pause" ? "Tournament paused" : "Tournament resumed"),
      onError: (error) => toast.error("That didn't go through", getApiErrorMessage(error, "Try again in a moment.")),
    });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <DossierHeader
        title={t.name}
        image={t.host.logo}
        cover={t.banner}
        square
        stamps={
          <>
            <StatusStamp status={t.phase} removed={removed} />
            {t.official && <Stamp tone="lavender" icon="seal">Official</Stamp>}
            {t.visibility === "unlisted" && <Stamp icon="eyeSlash">Unlisted</Stamp>}
          </>
        }
        meta={
          <>
            <span>{t.game}</span>
            <span>{formatLabel(t.format)}</span>
            <span>{[t.platform, t.mode === "lan" ? "LAN" : "Online", t.region].filter(Boolean).join(" · ")}</span>
            <span>Hosted by {t.official ? "Gamerie" : (t.host.name ?? "—")}</span>
          </>
        }
        actions={
          <>
            <ButtonLink href={playerAppLink(`/tournaments/${t.id}`)} external tone="outline" size="sm" icon="open">
              Open in Gamerie
            </ButtonLink>
            {t.phase === "live" && !removed && (
              <Button tone="outline" size="sm" icon="pause" disabled={actions.control.isPending} onClick={() => control("pause")}>
                Pause
              </Button>
            )}
            {t.phase === "paused" && !removed && (
              <Button tone="outline" size="sm" icon="play" disabled={actions.control.isPending} onClick={() => control("resume")}>
                Resume
              </Button>
            )}
            {cancellable && (
              <Button tone="ghost" size="sm" icon="close" className="text-mist-400 hover:text-danger" onClick={() => setDialog("cancel")}>
                Cancel
              </Button>
            )}
            {!removed && (
              <Button tone="ghost" size="sm" icon="eyeSlash" className="text-mist-400 hover:text-danger" onClick={() => setDialog("remove")}>
                Remove
              </Button>
            )}
          </>
        }
      />

      {removed && (
        <div className="rounded-2xl bg-danger/6 px-5 py-4 text-sm text-mist-200 ring-1 ring-inset ring-danger/25">
          Removed {formatDateTime(t.removedAt)}. {t.removedReason ? `Reason: ${t.removedReason}` : ""}
        </div>
      )}
      {t.phase === "cancelled" && t.cancelReason && (
        <div className="rounded-2xl bg-white/3 px-5 py-4 text-sm text-mist-300 ring-1 ring-inset ring-white/8">Cancelled: {t.cancelReason}</div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-6">
          <Figures
            items={[
              { label: "Entrants", value: `${t.entrantCount}${t.bracketSize ? ` / ${t.bracketSize}` : ""}`, hint: t.entrantType === "team" ? `Teams of ${t.teamSize ?? "?"}` : "Players" },
              { label: "Starts", value: t.startsAt ? formatDate(t.startsAt) : "—", hint: running ? "Under way" : undefined },
              { label: "Best of", value: t.matchRules?.bestOf.default ?? "—" },
              { label: "Prize", value: money(t.prize) ?? "None" },
            ]}
          />
          <Panel title="Entrants">
            {entrants.isLoading ? (
              <p className="text-sm text-mist-400">Loading entrants…</p>
            ) : (
              <EntrantList
                empty="Nobody has entered yet."
                rows={(entrants.data ?? []).map((entrant) => ({
                  id: entrant.id,
                  name: entrant.name,
                  avatar: entrant.avatar,
                  kind: entrant.kind,
                  targetId: entrant.kind === "team" ? entrant.teamId : entrant.userId,
                  status: entrant.status,
                  position: entrant.placement ?? entrant.seed,
                  positionKind: entrant.placement ? "place" : "seed",
                }))}
              />
            )}
          </Panel>
          <ActivityFeed entries={activity.data?.data ?? []} />
        </div>
        <aside className="grid min-w-0 gap-6">
          <Panel title="Setup">
            <Facts
              items={[
                ["Entry", statusLabel(t.registrationMode ?? "open")],
                ["Seeding", statusLabel(t.seedingMethod ?? "random")],
                ["Third place match", t.matchRules?.thirdPlaceMatch ? "Yes" : "No"],
                ["No-show after", t.matchRules ? `${t.matchRules.noShowMinutes} min` : null],
                ["Report window", t.matchRules ? `${t.matchRules.reportWindowMinutes} min` : null],
                ["Published", formatDate(t.publishedAt)],
                ["Finished", formatDate(t.completedAt)],
              ]}
            />
          </Panel>
          {t.description && (
            <Panel title="About">
              <p className="whitespace-pre-line text-sm leading-relaxed text-mist-300">{t.description}</p>
            </Panel>
          )}
        </aside>
      </div>

      {dialog === "cancel" && (
        <ReasonDialog
          title={`Cancel ${t.name}?`}
          description="Open matches stop, entrants are told, and the tournament ends without a champion. This can't be undone."
          confirmLabel="Cancel tournament"
          icon="close"
          onClose={() => setDialog(null)}
          onConfirm={(reason) => actions.cancel(reason).then(() => toast.info("Tournament cancelled"))}
        />
      )}
      {dialog === "remove" && (
        <ReasonDialog
          title={`Remove ${t.name}?`}
          description="It disappears from Gamerie for everyone except its organizer. Results already played stay on players' records."
          confirmLabel="Remove"
          icon="eyeSlash"
          onClose={() => setDialog(null)}
          onConfirm={(reason) => actions.remove(reason).then(() => toast.info("Tournament removed"))}
        />
      )}
    </div>
  );
}
