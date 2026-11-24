import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useBreadcrumb } from "@/app/shell/crumb";
import { Panel } from "@/components/layout/Panel";
import { BackLink } from "@/components/record/BackLink";
import { ReasonDialog } from "@/components/record/ReasonDialog";
import { Stamp } from "@/components/record/Stamp";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import type { ComboboxOption } from "@/components/ui/Combobox";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { GamePicker } from "@/features/games/GamePicker";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDate, formatDateTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { fromLocalInput, toLocalInput } from "@/lib/time";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { deleteChallenge, getChallenge, updateChallenge } from "./api";
import { FORMATS, scores, sides, STATUS, STATUS_ORDER } from "./labels";
import { LineupPicker } from "./LineupPicker";
import { impliedWinner, ResultFields, type ResultDraft } from "./ResultFields";
import type { Challenge, ChallengeStatus, UpdateChallengeInput } from "./types";

export function ChallengePage() {
  const { challengeId = "" } = useParams();
  const challenge = useQuery({ queryKey: ["admin", "challenges", "detail", challengeId], queryFn: () => getChallenge(challengeId) });
  const title = challenge.data ? sides(challenge.data).map((side) => side.name).join(" vs ") : null;
  useDocumentTitle(title ?? "Challenge");
  useBreadcrumb(title);

  if (challenge.isLoading)
    return (
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
        <Skeleton className="h-10 w-full max-w-96" />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
          <Skeleton className="h-80 rounded-card" />
          <Skeleton className="h-80 rounded-card" />
        </div>
      </div>
    );
  if (!challenge.data)
    return (
      <div className="grid gap-6">
        <BackLink to="/challenges" label="Challenges" />
        <StatePanel icon="warning" tone="danger" title="This challenge didn't load" description={getApiErrorMessage(challenge.error, "It may have been deleted.")} />
      </div>
    );
  return <ChallengeEditor key={challenge.data.id + challenge.data.updatedAt} challenge={challenge.data} />;
}

interface Draft {
  game: ComboboxOption | null;
  format: string;
  when: string;
  message: string;
  status: ChallengeStatus;
  result: ResultDraft;
  lineups: [string[], string[]];
}

function draftOf(challenge: Challenge): Draft {
  const score = scores(challenge);
  const [first] = sides(challenge);
  const winnerId = challenge.result?.winnerId;
  const lineup = (side: "challenger" | "challenged") => (challenge.lineups ?? []).filter((member) => member.side === side).map((member) => member.playerId);
  return {
    game: { value: "current", label: challenge.game },
    format: challenge.format,
    when: toLocalInput(challenge.scheduledDate),
    message: challenge.message ?? "",
    status: challenge.status,
    result: {
      score1: score ? String(score[0]) : "",
      score2: score ? String(score[1]) : "",
      winner: !winnerId ? "" : winnerId === "draw" ? "draw" : winnerId === first.id ? "first" : "second",
      notes: challenge.result?.notes ?? "",
    },
    lineups: [lineup("challenger"), lineup("challenged")],
  };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function ChallengeEditor({ challenge }: { challenge: Challenge }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const baseline = draftOf(challenge);
  const [draft, setDraft] = useState(baseline);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const [first, second] = sides(challenge);
  const team = challenge.type === "team";
  const size = challenge.teamSize ?? 1;
  const lineupsEditable = team && challenge.lineupRequired && challenge.status !== "completed";
  const completing = draft.status === "completed";
  const resultReady = !completing || (draft.result.score1 !== "" && draft.result.score2 !== "" && draft.result.winner !== "");
  const lineupsReady = !lineupsEditable || (draft.lineups[0].length === size && draft.lineups[1].length === size);
  const customFormat = !FORMATS.includes(draft.format);

  const changes: Omit<UpdateChallengeInput, "reason"> = {};
  if (draft.game && draft.game.label !== baseline.game?.label) changes.game = draft.game.label;
  if (draft.format.trim() !== baseline.format) changes.format = draft.format.trim();
  if (draft.when !== baseline.when) changes.scheduledDate = fromLocalInput(draft.when);
  if (draft.message.trim() !== baseline.message) changes.message = draft.message.trim();
  if (draft.status !== baseline.status) changes.status = draft.status;
  if (completing && (draft.status !== baseline.status || !same(draft.result, baseline.result))) {
    changes.p1Score = Number(draft.result.score1);
    changes.p2Score = Number(draft.result.score2);
    changes.winnerId = draft.result.winner === "draw" ? "draw" : draft.result.winner === "first" ? first.id! : second.id!;
    if (draft.result.notes.trim()) changes.resultNotes = draft.result.notes.trim();
  }
  if (lineupsEditable && !same(draft.lineups, baseline.lineups)) {
    changes.team1LineupPlayerIds = draft.lineups[0];
    changes.team2LineupPlayerIds = draft.lineups[1];
  }
  const dirty = Object.keys(changes).length > 0;
  const ready = dirty && resultReady && lineupsReady && draft.format.trim().length >= 2 && Boolean(draft.when);
  const refresh = () => void client.invalidateQueries({ queryKey: ["admin", "challenges"] });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <header className="grid gap-3">
        <h1 className="type-display flex flex-wrap items-baseline gap-x-4 gap-y-1 break-words text-display-sm text-mist-50">
          {[first, second].map((side, index) => (
            <span key={index} className="contents">
              {index === 1 && <span className="text-[0.55em] text-mist-500">vs</span>}
              {side.id ? (
                <Link to={`${side.to}/${side.id}`} className="hover:text-lavender-200">
                  {side.name}
                </Link>
              ) : (
                <span>{side.name}</span>
              )}
            </span>
          ))}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex flex-wrap gap-1.5">
            <Stamp tone={STATUS[challenge.status].tone}>{STATUS[challenge.status].label}</Stamp>
            {team && <Stamp>{`Teams · ${size}v${size}`}</Stamp>}
            {challenge.reportCount > 0 && (
              <Stamp tone="danger" icon="flag">
                {challenge.reportCount} {challenge.reportCount === 1 ? "report" : "reports"}
              </Stamp>
            )}
          </span>
          <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-mist-400">
            <span>{challenge.game}</span>
            <span>{challenge.format}</span>
            <span>{formatDateTime(challenge.scheduledDate)}</span>
            <span>Created {formatDate(challenge.createdAt)}</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2 xl:items-start">
        <div className="grid min-w-0 gap-6">
          <Panel title="The match">
            <div className="grid gap-5">
              <GamePicker id="challenge-game" value={draft.game} onChange={(option) => set("game", option)} />
              <ChoiceGroup legend="Format" columns={4}>
                {[...FORMATS, "custom"].map((option) => (
                  <ChoiceChip
                    key={option}
                    name="challenge-format"
                    label={option === "custom" ? "Other" : option}
                    checked={option === "custom" ? customFormat : draft.format === option}
                    onChange={() => set("format", option === "custom" ? "" : option)}
                  />
                ))}
              </ChoiceGroup>
              {customFormat && <TextField id="challenge-format-custom" label="Format" placeholder="First to 10" maxLength={80} value={draft.format} onChange={(event) => set("format", event.target.value)} />}
              <TextField id="challenge-when" label="When" type="datetime-local" value={draft.when} onChange={(event) => set("when", event.target.value)} />
              <TextAreaField id="challenge-message" label="Message" rows={2} maxLength={1000} value={draft.message} onChange={(event) => set("message", event.target.value)} />
            </div>
          </Panel>
          {lineupsEditable && (
            <Panel title="Lineups" description={`${size} from each team. Locked once the result is in.`}>
              <div className="grid gap-6 sm:grid-cols-2">
                {first.id && <LineupPicker teamId={first.id} teamName={first.name} size={size} value={draft.lineups[0]} onChange={(ids) => set("lineups", [ids, draft.lineups[1]])} />}
                {second.id && <LineupPicker teamId={second.id} teamName={second.name} size={size} value={draft.lineups[1]} onChange={(ids) => set("lineups", [draft.lineups[0], ids])} />}
              </div>
            </Panel>
          )}
        </div>

        <div className="grid min-w-0 gap-6">
          <Panel title="Status" description={challenge.status === "completed" ? "Changing it, or the score, takes the old result off both records first." : undefined}>
            <div className="grid gap-6">
              <ChoiceGroup legend="Where it stands" columns={2}>
                {STATUS_ORDER.map((status) => (
                  <ChoiceChip
                    key={status}
                    name="challenge-status"
                    label={STATUS[status].label}
                    checked={draft.status === status}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        status,
                        result: status === "completed" && !current.result.winner ? { ...current.result, winner: impliedWinner(current.result.score1, current.result.score2) } : current.result,
                      }))
                    }
                  />
                ))}
              </ChoiceGroup>
              {completing && <ResultFields names={[first.name, second.name]} value={draft.result} onChange={(result) => set("result", result)} />}
            </div>
          </Panel>
          {team && !lineupsEditable && (challenge.lineups?.length ?? 0) > 0 && (
            <Panel title="Lineups">
              <div className="grid gap-5 sm:grid-cols-2">
                {(["challenger", "challenged"] as const).map((side, index) => (
                  <div key={side} className="grid content-start gap-2">
                    <p className="text-sm font-medium text-mist-200">{index === 0 ? first.name : second.name}</p>
                    <ul className="grid gap-1 text-sm text-mist-300">
                      {challenge.lineups!.filter((member) => member.side === side).map((member) => (
                        <li key={member.id}>
                          <Link to={`/users/${member.playerId}`} className="hover:text-lavender-200">
                            {member.playerNameSnapshot}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>
          )}
          <Panel title="Delete this challenge">
            <p className="text-sm leading-relaxed text-mist-400">
              {challenge.status === "completed" ? "The result comes off both records, and the challenge is gone for good." : "It disappears for both sides, for good."}
            </p>
            <Button tone="outline" size="sm" icon="trash" className="mt-4 text-danger" onClick={() => setDeleting(true)}>
              Delete challenge
            </Button>
          </Panel>
        </div>
      </div>

      {dirty && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card bg-ink-900/90 px-5 py-3 ring-1 ring-inset ring-white/10 backdrop-blur-md">
          <p className="text-sm text-mist-400">
            {!resultReady ? "Add the score and winner" : !lineupsReady ? `Pick ${size} for each lineup` : "Unsaved changes"}
          </p>
          <div className="flex gap-2">
            <Button tone="ghost" size="sm" onClick={() => setDraft(baseline)}>
              Discard
            </Button>
            <Button size="sm" disabled={!ready} onClick={() => setConfirming(true)}>
              Save changes
            </Button>
          </div>
        </div>
      )}

      {confirming && (
        <ReasonDialog
          title="Save these changes?"
          description={changes.status || changes.p1Score !== undefined ? "Both sides' records update with the new result." : "Both sides see the new details."}
          confirmLabel="Save"
          icon="edit"
          tone="brand"
          onClose={() => setConfirming(false)}
          onConfirm={(reason) =>
            updateChallenge(challenge.id, { ...changes, reason }).then(() => {
              toast.success("Challenge saved");
              refresh();
            })
          }
        />
      )}
      {deleting && (
        <ReasonDialog
          title="Delete this challenge?"
          description={`${first.name} vs ${second.name}. This can't be undone.`}
          confirmLabel="Delete"
          icon="trash"
          onClose={() => setDeleting(false)}
          onConfirm={(reason) =>
            deleteChallenge(challenge.id, reason).then(() => {
              toast.info("Challenge deleted");
              refresh();
              navigate("/challenges");
            })
          }
        />
      )}
    </div>
  );
}
