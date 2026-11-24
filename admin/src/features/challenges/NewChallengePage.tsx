import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useBreadcrumb } from "@/app/shell/crumb";
import { Panel } from "@/components/layout/Panel";
import { Button } from "@/components/ui/Button";
import { ChoiceChip, ChoiceGroup } from "@/components/ui/ChoiceChips";
import type { ComboboxOption } from "@/components/ui/Combobox";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { OptionCards } from "@/components/ui/OptionCards";
import { GamePicker } from "@/features/games/GamePicker";
import { EntityPicker } from "@/features/people/components/EntityPicker";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { createChallenge } from "./api";
import { fromLocalInput, toLocalInput } from "@/lib/time";
import { FORMATS } from "./labels";
import { LineupPicker } from "./LineupPicker";
import { ResultFields, type ResultDraft } from "./ResultFields";

/** Set up a challenge between two players or teams, ready to play or already played. */
export function NewChallengePage() {
  useDocumentTitle("New challenge");
  useBreadcrumb("New challenge");
  const navigate = useNavigate();
  const client = useQueryClient();
  const [type, setType] = useState<"user" | "team">("user");
  const [first, setFirst] = useState<ComboboxOption | null>(null);
  const [second, setSecond] = useState<ComboboxOption | null>(null);
  const [teamSize, setTeamSize] = useState(5);
  const [lineups, setLineups] = useState<[string[], string[]]>([[], []]);
  const [game, setGame] = useState<ComboboxOption | null>(null);
  const [format, setFormat] = useState(FORMATS[0]);
  const [customFormat, setCustomFormat] = useState("");
  const [when, setWhen] = useState(() => toLocalInput(new Date(Date.now() + 86_400_000).toISOString()));
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"accepted" | "completed">("accepted");
  const [result, setResult] = useState<ResultDraft>({ score1: "", score2: "", winner: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);

  const finalFormat = format === "custom" ? customFormat.trim() : format;
  const names: [string, string] = [first?.label ?? (type === "team" ? "First team" : "First player"), second?.label ?? (type === "team" ? "Second team" : "Second player")];
  const lineupsReady = type === "user" || (lineups[0].length === teamSize && lineups[1].length === teamSize);
  const resultReady = status === "accepted" || (result.score1 !== "" && result.score2 !== "" && result.winner !== "");
  const ready = Boolean(first && second && game && when && finalFormat.length >= 2 && lineupsReady && resultReady);

  const switchType = (next: "user" | "team") => {
    setType(next);
    setFirst(null);
    setSecond(null);
    setLineups([[], []]);
  };
  const resize = (size: number) => {
    setTeamSize(size);
    setLineups(([a, b]) => [a.slice(0, size), b.slice(0, size)]);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready || !first || !second || !game) return;
    setSaving(true);
    setFailure(null);
    const winnerId = result.winner === "draw" ? "draw" : result.winner === "first" ? first.value : second.value;
    try {
      const created = await createChallenge({
        type,
        ...(type === "user"
          ? { player1Id: first.value, player2Id: second.value }
          : { team1Id: first.value, team2Id: second.value, teamSize, team1LineupPlayerIds: lineups[0], team2LineupPlayerIds: lineups[1] }),
        gameId: game.value,
        scheduledDate: fromLocalInput(when),
        format: finalFormat,
        message: message.trim() || undefined,
        status,
        ...(status === "completed" ? { p1Score: Number(result.score1), p2Score: Number(result.score2), winnerId, resultNotes: result.notes.trim() || undefined } : {}),
      });
      toast.success(status === "completed" ? "Challenge and result recorded" : "Challenge created");
      void client.invalidateQueries({ queryKey: ["admin", "challenges"] });
      navigate(`/challenges/${created.id}`, { replace: true });
    } catch (caught) {
      setFailure(caught);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <header>
        <h1 className="type-display text-display-sm text-mist-50">New challenge</h1>
        <p className="mt-2.5 text-[0.95rem] text-mist-400">Skips the invite: both sides are in straight away.</p>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2 xl:items-start">
        <Panel title="Who's playing">
          <div className="grid gap-6">
            <OptionCards
              legend="Between"
              value={type}
              onChange={switchType}
              options={[
                { value: "user", label: "Two players", icon: "user" },
                { value: "team", label: "Two teams", icon: "team" },
              ]}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <EntityPicker id="challenge-first" label={type === "team" ? "First team" : "First player"} kind={type} value={first} onChange={(option) => (setFirst(option), setLineups(([, b]) => [[], b]))} exclude={second?.value} />
              <EntityPicker id="challenge-second" label={type === "team" ? "Second team" : "Second player"} kind={type} value={second} onChange={(option) => (setSecond(option), setLineups(([a]) => [a, []]))} exclude={first?.value} />
            </div>
            {type === "team" && (
              <>
                <ChoiceGroup legend="Team size" columns={5}>
                  {[1, 2, 3, 4, 5].map((size) => (
                    <ChoiceChip key={size} name="challenge-size" label={`${size}v${size}`} checked={teamSize === size} onChange={() => resize(size)} />
                  ))}
                </ChoiceGroup>
                {(first || second) && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {first && <LineupPicker teamId={first.value} teamName={first.label} size={teamSize} value={lineups[0]} onChange={(ids) => setLineups(([, b]) => [ids, b])} />}
                    {second && <LineupPicker teamId={second.value} teamName={second.label} size={teamSize} value={lineups[1]} onChange={(ids) => setLineups(([a]) => [a, ids])} />}
                  </div>
                )}
              </>
            )}
          </div>
        </Panel>

        <div className="grid min-w-0 gap-6">
          <Panel title="The match">
            <div className="grid gap-5">
              <GamePicker id="challenge-game" value={game} onChange={setGame} />
              <ChoiceGroup legend="Format" columns={4}>
                {[...FORMATS, "custom"].map((option) => (
                  <ChoiceChip key={option} name="challenge-format" label={option === "custom" ? "Other" : option} checked={format === option} onChange={() => setFormat(option)} />
                ))}
              </ChoiceGroup>
              {format === "custom" && <TextField id="challenge-format-custom" label="Format" placeholder="First to 10" maxLength={80} value={customFormat} onChange={(event) => setCustomFormat(event.target.value)} />}
              <TextField id="challenge-when" label="When" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} />
              <TextAreaField id="challenge-message" label="Message (optional)" rows={2} maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} />
            </div>
          </Panel>

          <Panel title="Where it stands">
            <div className="grid gap-6">
              <OptionCards
                legend="Status"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "accepted", label: "Ready to play", description: "Both sides see it as accepted", icon: "clock" },
                  { value: "completed", label: "Already played", description: "Record the result now", icon: "check" },
                ]}
              />
              {status === "completed" && <ResultFields names={names} value={result} onChange={setResult} />}
            </div>
          </Panel>
        </div>
      </div>

      {failure != null && <Notice tone="danger">{getApiErrorMessage(failure, "The challenge wasn't created. Try again.")}</Notice>}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card bg-ink-900/90 px-5 py-3 ring-1 ring-inset ring-white/10 backdrop-blur-md">
        <p className="text-sm text-mist-400">
          {!first || !second ? `Pick both ${type === "team" ? "teams" : "players"}` : !lineupsReady ? `Pick ${teamSize} for each lineup` : !game ? "Pick the game" : !resultReady ? "Add the score" : "Ready to create"}
        </p>
        <Button type="submit" size="sm" disabled={!ready || saving}>
          {saving ? "Creating…" : "Create challenge"}
        </Button>
      </div>
    </form>
  );
}
