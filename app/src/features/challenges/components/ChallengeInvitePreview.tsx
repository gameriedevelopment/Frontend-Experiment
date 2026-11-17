import { Avatar } from "@/components/ui/Avatar";
import { TokenMark } from "@/components/ui/TokenMark";
import { cn } from "@/lib/cn";

interface PreviewSide {
  name: string;
  image?: string;
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="type-label shrink-0 text-mist-500">{label}</dt>
      <dd className={cn("min-w-0 truncate text-right text-sm", value ? "font-semibold" : "text-mist-500")}>
        {value || "Not set"}
      </dd>
    </div>
  );
}

/** The invite as the other side will see it, updating while the challenge is composed. */
export function ChallengeInvitePreview({
  from,
  to,
  game,
  format,
  when,
  message,
  team,
}: {
  from: PreviewSide;
  to: PreviewSide | null;
  game?: string;
  format: string;
  when?: string;
  message?: string;
  team?: string;
}) {
  const date = when
    ? new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(when))
    : undefined;

  return (
    <article
      aria-label="Challenge preview"
      className="overflow-hidden rounded-card bg-ink-900 shadow-[0_40px_90px_-40px_rgb(0_0_0/0.9)] ring-1 ring-white/10"
    >
      <header className="relative overflow-hidden bg-lavender-400 px-5 pb-5 pt-4 text-ink-950">
        <div className="halftone absolute inset-0 text-ink-950/20 mask-[linear-gradient(to_bottom_left,black,transparent_65%)]" />
        <div className="relative flex items-center justify-between">
          <span className="type-label">{team ? "Team challenge" : "Challenge"}</span>
          {team && <span className="type-label truncate text-ink-950/60">{team}</span>}
        </div>
        <div className="relative mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="grid min-w-0 justify-items-start gap-2">
            <Avatar src={from.image} name={from.name} size="md" tone="ink" className="rounded-full" />
            <span className="w-full truncate text-sm font-semibold">{from.name}</span>
          </div>
          <span className="font-serif text-3xl italic leading-none text-ink-950/70">vs</span>
          <div className="grid min-w-0 justify-items-end gap-2">
            {to ? (
              <Avatar src={to.image} name={to.name} size="md" tone="ink" className="rounded-full" />
            ) : (
              <span className="size-10 rounded-full border border-dashed border-ink-950/40" />
            )}
            <span className={cn("w-full truncate text-right text-sm font-semibold", !to && "text-ink-950/50")}>
              {to?.name ?? "Opponent"}
            </span>
          </div>
        </div>
      </header>

      <dl className="grid gap-3 px-5 py-5">
        <Row label="Game" value={game} />
        <Row label="Format" value={format} />
        <Row label="When" value={date} />
      </dl>

      {message && (
        <p className="mx-5 mb-5 line-clamp-3 border-l-2 border-lavender-400/50 pl-3 text-sm leading-relaxed text-mist-300">
          {message}
        </p>
      )}

      <footer className="type-label flex items-center justify-between border-t border-white/6 px-5 py-3.5 text-mist-500">
        <span className="flex items-center gap-2">
          <TokenMark className="h-3.5 text-lavender-400" />
          gamerie.gg
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-lavender-300" />
          Awaiting reply
        </span>
      </footer>
    </article>
  );
}
