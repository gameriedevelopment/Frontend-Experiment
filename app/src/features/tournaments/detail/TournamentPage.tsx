import { useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { Tabs } from "@/components/ui/Tabs";
import { cn, titleSize } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { checkInEntrant } from "../api";
import { EntrantMark } from "../components/EntrantMark";
import { PhaseBadge, phaseOf } from "../components/PhaseBadge";
import { HeroBanner } from "../components/HeroBanner";
import { useHostedTournament, useNow, useTournamentAction, useTournamentBracket } from "../hooks";
import type { HostedTournamentDetail } from "../types";
import { FORMAT_LABELS, HOST_TYPE_LABELS, bestOfLabel, durationLabel, formatMoney } from "../utils";
import { BracketTab } from "./BracketTab";
import { MatchesTab } from "./MatchesTab";
import { OverviewTab } from "./OverviewTab";
import { ParticipantsTab } from "./ParticipantsTab";
import { RegisterDialog, type RegisterMode } from "./RegisterDialog";
import { ManageTab } from "./manage/ManageTab";
import { RulesTab } from "./RulesTab";
import { primaryAction } from "./viewer";

export type TournamentTab = "overview" | "bracket" | "matches" | "participants" | "rules" | "manage";

const tabs: Array<{ id: TournamentTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "bracket", label: "Bracket" },
  { id: "matches", label: "Matches" },
  { id: "participants", label: "Participants" },
  { id: "rules", label: "Rules" },
  { id: "manage", label: "Manage" },
];

function matchLength(tournament: HostedTournamentDetail): string {
  const rules = tournament.matchRules;
  if (!rules) return "Not set";
  const longer = Object.values(rules.bestOf.rounds ?? {}).filter((value) => value > rules.bestOf.default);
  return longer.length
    ? `Bo${rules.bestOf.default}, finals Bo${Math.max(...longer)}`
    : bestOfLabel(rules.bestOf.default);
}

function HeroAction({
  tournament,
  onRegister,
  onTab,
}: {
  tournament: HostedTournamentDetail;
  onRegister: (mode: RegisterMode) => void;
  onTab: (tab: TournamentTab, match?: string) => void;
}) {
  const started = ["live", "paused", "completed"].includes(tournament.phase);
  const bracket = useTournamentBracket(tournament.id, started, tournament.phase === "live");
  const now = useNow();
  const action = primaryAction(tournament, bracket.data, now);
  const checkIn = useTournamentAction(tournament.id, (entrantId: string) => checkInEntrant(tournament.id, entrantId));

  const status = (label: string, done = false) => (
    <span
      className={cn(
        "flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold ring-1 ring-inset",
        done ? "bg-signal/12 text-signal ring-signal/30" : "bg-white/5 text-mist-200 ring-white/12",
      )}
    >
      {done && <Icon name="check" weight="bold" className="size-4" />}
      {label}
    </span>
  );

  switch (action.kind) {
    case "continue_draft":
      return (
        <LinkButton to={`/tournaments/${tournament.id}/edit`} icon="edit">
          Continue setup
        </LinkButton>
      );
    case "register":
      return (
        <Button icon="ticket" onClick={() => onRegister({ kind: "register" })}>
          Register
        </Button>
      );
    case "respond_invite":
      return (
        <Button
          icon="mail"
          onClick={() =>
            onRegister({ kind: "invitation", entrantId: action.entrantId, teamId: tournament.viewer.entrant?.teamId })
          }
        >
          Answer invitation
        </Button>
      );
    case "check_in":
      return (
        <Button
          icon="check"
          disabled={checkIn.isPending}
          onClick={() =>
            checkIn.mutate(action.entrantId, {
              onSuccess: () => toast.success("Checked in", "You're set for the start."),
              onError: (error) => toast.error("Check-in failed", getApiErrorMessage(error, "Try again.")),
            })
          }
        >
          {checkIn.isPending ? "Checking in…" : action.standby ? "Check in as standby" : "Check in"}
        </Button>
      );
    case "checked_in":
      return status(action.standby ? "Checked in as standby" : "Checked in", true);
    case "waiting":
      return status(action.label);
    case "my_match": {
      const { stage } = action;
      const label =
        stage.kind === "needs_time"
          ? "Set your match time"
          : stage.kind === "ready_check"
            ? "Mark ready"
            : stage.kind === "play"
              ? "Go to your match"
              : "Your match";
      return (
        <Button
          icon="arrowRight"
          tone={stage.kind === "waiting" || stage.kind === "awaiting_time" ? "outline" : "lavender"}
          className={stage.kind === "waiting" || stage.kind === "awaiting_time" ? "bg-ink-950/50 backdrop-blur" : undefined}
          onClick={() => onTab("matches", action.matchId)}
        >
          {label}
        </Button>
      );
    }
    case "manage":
      return (
        <Button tone="outline" icon="settings" className="bg-ink-950/50 backdrop-blur" onClick={() => onTab("manage")}>
          Manage
        </Button>
      );
    default:
      return action.label ? status(action.label) : null;
  }
}

function PageSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-6">
      <Skeleton className="h-4 w-32 rounded-full" />
      <Skeleton className="h-104 rounded-panel" />
      <Skeleton className="h-10 w-96 max-w-full rounded-full" />
      <Skeleton className="h-64 rounded-card" />
    </div>
  );
}

export function TournamentPage() {
  const { tournamentId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const query = useHostedTournament(tournamentId);
  useDocumentTitle(query.data?.name);
  const now = useNow();
  const [register, setRegister] = useState<RegisterMode | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [copied, setCopied] = useState(false);

  const visibleTabs = tabs.filter((item) => item.id !== "manage" || query.data?.viewer.isOrganizer);
  const requested = params.get("tab") as TournamentTab | null;
  const tab: TournamentTab = visibleTabs.some((item) => item.id === requested) ? requested! : "overview";
  const goTab = (next: TournamentTab, match?: string) => {
    const nextParams = new URLSearchParams();
    if (next !== "overview") nextParams.set("tab", next);
    if (match) nextParams.set("match", match);
    setParams(nextParams);
    if (match) setFocusRequest((count) => count + 1);
  };

  if (query.isLoading) return <PageSkeleton />;
  const tournament = query.data;
  if (query.isError || !tournament) {
    return (
      <StatePanel
        icon="trophy"
        tone="danger"
        title="Tournament not found"
        description={getApiErrorMessage(query.error, "It may have been removed, or the link is wrong.")}
        action={
          <LinkButton to="/tournaments" tone="outline" size="sm" icon="arrowLeft">
            Back to tournaments
          </LinkButton>
        }
      />
    );
  }

  const [phase, tone] = phaseOf(tournament);
  const unit = tournament.entrantType === "team" ? "Teams" : "Players";
  const fill = tournament.bracketSize ? Math.min(100, (tournament.entrantCount / tournament.bracketSize) * 100) : 0;
  const startsIn =
    tournament.startsAt && new Date(tournament.startsAt).getTime() > now
      ? durationLabel(new Date(tournament.startsAt).getTime() - now)
      : null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      setCopied(true);
      toast.success("Link copied", "Share it with your team or hub.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const stats: Array<{ label: string; value: string; extra?: ReactNode; accent?: boolean }> = [
    {
      label: "Prize",
      value: tournament.prize?.total ? formatMoney(tournament.prize.total, tournament.prize.currency) : "No prize",
      accent: Boolean(tournament.prize?.total),
    },
    {
      label: unit,
      value: `${tournament.entrantCount} / ${tournament.bracketSize ?? "—"}`,
      extra: tournament.bracketSize ? (
        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/8">
          <span className="block h-full rounded-full bg-lavender-400" style={{ width: `${fill}%` }} />
        </span>
      ) : null,
    },
    { label: "Format", value: FORMAT_LABELS[tournament.format] },
    { label: "Match length", value: matchLength(tournament) },
    {
      label: "Starts",
      value: tournament.startsAt
        ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
            new Date(tournament.startsAt),
          )
        : "To be set",
      extra: startsIn ? <span className="mt-1 block text-xs text-lavender-300">in {startsIn}</span> : null,
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Link
        to="/tournaments"
        className="group flex w-fit items-center gap-2 text-sm font-medium text-mist-400 transition-colors hover:text-mist-50"
      >
        <Icon name="arrowLeft" className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Tournaments
      </Link>

      <section className="overflow-hidden rounded-panel bg-ink-900 ring-1 ring-inset ring-white/8">
        <HeroBanner src={tournament.banner} game={tournament.game} className="min-h-56 sm:min-h-72">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <PhaseBadge label={phase} tone={tone} />
                <span className="type-label rounded-full bg-ink-950/60 px-2.5 py-1 text-mist-200 ring-1 ring-inset ring-white/10 backdrop-blur">
                  {tournament.official ? "Official · Gamerie" : "Hosted on Gamerie"}
                </span>
                <span className="type-label hidden rounded-full bg-ink-950/60 px-2.5 py-1 text-mist-300 ring-1 ring-inset ring-white/10 backdrop-blur sm:inline">
                  {[tournament.platform, tournament.mode === "lan" ? "LAN" : "Online", tournament.region]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <p className="type-label mt-5 text-lavender-300">{tournament.game}</p>
              <h1 className={cn("type-display mt-2 break-words leading-[0.95]", titleSize(tournament.name))}>{tournament.name}</h1>
              <p className="mt-3 flex items-center gap-2.5 text-sm text-mist-300">
                <EntrantMark name={tournament.host.name ?? "Gamerie"} src={tournament.host.logo} size="sm" />
                {tournament.official ? (
                  "Run by Gamerie"
                ) : (
                  <span>
                    Hosted by <span className="font-semibold text-mist-50">{tournament.host.name}</span>
                    {tournament.host.type && <span className="text-mist-500"> · {HOST_TYPE_LABELS[tournament.host.type]}</span>}
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <HeroAction tournament={tournament} onRegister={setRegister} onTab={goTab} />
              <button
                type="button"
                onClick={() => void copyLink()}
                aria-label="Copy tournament link"
                className="grid size-12 place-items-center rounded-full bg-ink-950/50 text-mist-200 ring-1 ring-inset ring-white/15 backdrop-blur transition-colors hover:text-mist-50 hover:ring-white/30"
              >
                <Icon name={copied ? "check" : "share"} className="size-[1.1rem]" />
              </button>
            </div>
          </div>
        </HeroBanner>

        <dl className="grid grid-cols-2 border-t border-white/6 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "min-w-0 px-5 py-4 sm:px-6 sm:py-5",
                index > 0 && "lg:border-l lg:border-white/6",
                index % 2 === 1 && "border-l border-white/6 sm:border-l-0",
                index >= 2 && "border-t border-white/6 lg:border-t-0",
                index === 4 && "col-span-2 sm:col-span-1",
              )}
            >
              <dt className="type-label text-mist-500">{stat.label}</dt>
              <dd className={cn("mt-2 truncate text-[0.95rem] font-semibold", stat.accent && "text-lavender-200")}>
                {stat.value}
                {stat.extra}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {tournament.phase === "cancelled" ? (
        <p role="status" className="flex items-start gap-3 rounded-2xl bg-danger/8 px-4 py-3 text-sm text-mist-200 ring-1 ring-inset ring-danger/25">
          <Icon name="warning" className="mt-0.5 size-4 shrink-0 text-danger" />
          This tournament was cancelled{tournament.cancelReason ? `: ${tournament.cancelReason}` : "."} Finished results
          stay on players' records.
        </p>
      ) : tournament.phase === "paused" ? (
        <p role="status" className="flex items-start gap-3 rounded-2xl bg-white/4 px-4 py-3 text-sm text-mist-200 ring-1 ring-inset ring-white/10">
          <Icon name="hourglass" className="mt-0.5 size-4 shrink-0 text-lavender-300" />
          Paused by the organizer. Match timers are on hold, and deadlines move by the length of the pause.
        </p>
      ) : tournament.phase === "draft" ? (
        <p role="status" className="flex items-start gap-3 rounded-2xl bg-white/4 px-4 py-3 text-sm text-mist-200 ring-1 ring-inset ring-white/10">
          <Icon name="edit" className="mt-0.5 size-4 shrink-0 text-lavender-300" />
          Only you can see this draft. Publish it to open registration.
        </p>
      ) : null}

      <Tabs label="Tournament sections" items={visibleTabs} value={tab} onChange={(next) => goTab(next)} indicatorId="tournament-tab" />

      {tab === "overview" ? (
        <OverviewTab tournament={tournament} onTab={goTab} onRegister={setRegister} />
      ) : tab === "bracket" ? (
        <BracketTab tournament={tournament} onOpenMatch={(match) => goTab("matches", match)} />
      ) : tab === "matches" ? (
        <MatchesTab tournament={tournament} focusMatchId={params.get("match")} focusRequest={focusRequest} />
      ) : tab === "participants" ? (
        <ParticipantsTab tournament={tournament} onEditRoster={setRegister} />
      ) : tab === "rules" ? (
        <RulesTab tournament={tournament} />
      ) : (
        <ManageTab tournament={tournament} onTab={goTab} />
      )}

      {register && <RegisterDialog tournament={tournament} mode={register} onClose={() => setRegister(null)} />}
    </div>
  );
}
