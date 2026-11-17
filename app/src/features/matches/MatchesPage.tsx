import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { useAuthStore } from "@/features/auth/authStore";
import { usePlayerProfile } from "@/features/profile/hooks";
import { getMatchPresentation, matchGameName, matchPlayedAt, matchResultStyles, matchSourceLabels } from "@/features/profile/matchHistory";
import type { MatchHistoryEntry } from "@/features/profile/types";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { MatchDetailDialog } from "./components/MatchDetailDialog";
import { MatchLogDialog } from "./components/MatchLogDialog";
import { usePlayerMatchPage } from "./hooks";

const PAGE_SIZE = 20;
const verifiedSources = new Set(["screenshot", "challenge", "tournament", "organiser", "official_api"]);
const shortDate = (value?: string) => (value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : null);

function Row({ match, playerId, onOpen }: { match: MatchHistoryEntry; playerId: string; onOpen: () => void }) {
  const presentation = getMatchPresentation(match, playerId);
  const result = matchResultStyles[presentation.state];
  const date = shortDate(matchPlayedAt(match));
  const source = match.verificationSource;
  return (
    <button type="button" onClick={onOpen} className="group flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-white/4">
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold", result?.className ?? "bg-white/6 text-mist-400")} aria-label={result?.label ?? presentation.state}>
        {result?.mark ?? "–"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold group-hover:text-lavender-100">{matchGameName(match.game)}</span>
        <span className="block truncate text-xs text-mist-400">
          {[presentation.opponent ? `vs ${presentation.opponent}` : null, match.eventName, date].filter(Boolean).join(" · ") || "Gamerie match"}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold tabular-nums">{presentation.label}</span>
        {source && (
          <span className="mt-0.5 flex items-center justify-end gap-1 text-xs text-mist-500">
            {verifiedSources.has(source) && <Icon name="verified" className="size-3 text-lavender-300" />}
            <span className="hidden sm:inline">{matchSourceLabels[source]}</span>
          </span>
        )}
      </span>
    </button>
  );
}

function Record({ username }: { username?: string }) {
  const profile = usePlayerProfile(username);
  const stats = profile.data?.stats;
  const played = stats?.matchesPlayed ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const rate = played ? Math.round((wins / played) * 100) : null;
  const facts: Array<[string, string]> = [
    ["Played", profile.isLoading ? "—" : played.toLocaleString()],
    ["Wins", profile.isLoading ? "—" : wins.toLocaleString()],
    ["Losses", profile.isLoading ? "—" : losses.toLocaleString()],
    ["Win rate", rate === null ? "—" : `${rate}%`],
  ];
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-card bg-ink-900/60 ring-1 ring-inset ring-white/6 sm:grid-cols-4">
      {facts.map(([label, value], index) => (
        <div key={label} className={cn("border-white/6 px-5 py-4 sm:px-6", index % 2 && "border-l", index > 1 && "border-t sm:border-t-0", index === 2 && "sm:border-l")}>
          <dt className="type-label text-mist-500">{label}</dt>
          <dd className={cn("mt-1.5 text-xl font-semibold tabular-nums", label === "Wins" && wins > 0 && "text-signal")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MatchesPage() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get("page"));
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;
  const matches = usePlayerMatchPage(user?.id, page, PAGE_SIZE);
  const [selected, setSelected] = useState<MatchHistoryEntry | null>(null);
  const logging = location.pathname.startsWith("/matches/log");
  const items = matches.data?.data ?? [];
  const totalPages = matches.data?.totalPages ?? 1;

  // A page past the end (after records change) falls back to the last real page.
  useEffect(() => {
    if (matches.data && matches.data.totalPages > 0 && page > matches.data.totalPages) setParams({ page: String(matches.data.totalPages) }, { replace: true });
  }, [matches.data, page, setParams]);

  const closeLogger = useCallback(() => navigate(page > 1 ? `/matches?page=${page}` : "/matches", { replace: true }), [navigate, page]);
  const goTo = (next: number) => {
    setParams(next > 1 ? { page: String(next) } : {});
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <PageHeader
        title="Matches"
        description="Every result on your record, and where it came from."
        actions={
          <LinkButton to="/matches/log" icon="camera">
            Log a match
          </LinkButton>
        }
      />

      <Record username={user?.username ?? user?.id} />

      {matches.isLoading ? (
        <div aria-hidden="true" className="grid gap-1 rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : matches.isError ? (
        <StatePanel
          icon="warning"
          tone="danger"
          title="Your matches didn't load"
          description={getApiErrorMessage(matches.error, "Try again in a moment.")}
          action={
            <Button tone="outline" size="sm" icon="refresh" onClick={() => void matches.refetch()}>
              Try again
            </Button>
          }
        />
      ) : items.length ? (
        <div className="grid gap-5">
          <section aria-label="Recorded matches" className={cn("rounded-card bg-ink-900/60 p-2 ring-1 ring-inset ring-white/6 transition-opacity", matches.isPlaceholderData && "opacity-60")}>
            <p className="px-3 pb-1 pt-2 text-xs text-mist-500">
              {(matches.data?.total ?? items.length).toLocaleString()} {matches.data?.total === 1 ? "match" : "matches"} · newest first
            </p>
            <ul className="grid grid-cols-[minmax(0,1fr)]">
              {items.map((match, index) => (
                <li key={match.id ?? `${matchPlayedAt(match)}-${index}`}>
                  <Row match={match} playerId={user?.id ?? ""} onOpen={() => setSelected(match)} />
                </li>
              ))}
            </ul>
          </section>
          <Pagination page={page} totalPages={totalPages} onPage={goTo} />
        </div>
      ) : (
        <StatePanel
          icon="matches"
          title="No matches on your record yet"
          description="Challenge and tournament results land here automatically. For other games, log a match with a screenshot of the result screen."
          action={
            <LinkButton to="/matches/log" size="sm" icon="camera">
              Log your first match
            </LinkButton>
          }
        />
      )}

      {selected && <MatchDetailDialog match={selected} playerId={user?.id ?? ""} onClose={() => setSelected(null)} />}
      {logging && <MatchLogDialog onClose={closeLogger} />}
    </div>
  );
}
