import { useState } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stamp } from "@/components/record/Stamp";
import { waited } from "@/features/queue/lanes";
import { playerAppLink } from "@/lib/env";
import { cn } from "@/lib/cn";
import { getApiErrorMessage } from "@/lib/errors";
import { formatDateTime, statusLabel } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useReportContext, useReportDecision, useReportHistory } from "./hooks";
import { RichText } from "@/components/record/RichText";
import { contentMeta, reportedSummary } from "./labels";
import type { Report } from "./types";

function Person({ label, person }: { label: string; person: { id: string; username: string | null; profileImage: string | null } | undefined }) {
  return (
    <div className="min-w-0">
      <p className="type-label text-[0.6rem] text-mist-500">{label}</p>
      {person?.id ? (
        <Link to={`/users/${person.id}`} className="mt-2 flex items-center gap-2.5 text-sm font-medium hover:text-lavender-200">
          <Avatar src={person.profileImage ?? undefined} name={person.username ?? "?"} size="sm" />
          <span className="truncate">{person.username ?? "Unknown"}</span>
        </Link>
      ) : (
        <p className="mt-2 text-sm text-mist-400">Unknown</p>
      )}
    </div>
  );
}

/** One report: what was reported, by whom, its history, and the decision. Keyed by report. */
export function ReportCase({ report, onDecided }: { report: Report; onDecided: () => void }) {
  const context = useReportContext(report.id);
  const history = useReportHistory(report.id);
  const decision = useReportDecision();
  const [note, setNote] = useState("");
  const meta = contentMeta(report.contentType);
  const removable = report.contentType === "post" || report.contentType === "comment";
  const pending = report.status === "pending";
  const wait = pending ? waited(report.createdAt, 24) : null;
  const post = context.data?.post;
  const ready = note.trim().length >= 5 && !decision.isPending;

  const decide = (outcome: "resolved" | "dismissed", remove = false) =>
    decision.mutate(
      { report, outcome, note: note.trim(), remove },
      {
        onSuccess: () => {
          toast.success(remove ? `${meta.label} removed` : outcome === "resolved" ? "Report resolved" : "Report dismissed");
          onDecided();
        },
      },
    );

  return (
    <article className="grid gap-6 rounded-card bg-ink-900/70 p-5 ring-1 ring-inset ring-white/6 sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <Stamp tone="danger" icon="flag">{statusLabel(report.type)}</Stamp>
            <Stamp icon={meta.icon}>{meta.label}</Stamp>
            {!pending && <Stamp tone={report.status === "resolved" ? "signal" : "mist"}>{statusLabel(report.status)}</Stamp>}
          </p>
          <p className="mt-3 font-mono text-xs text-mist-500">Reported {formatDateTime(report.createdAt)}</p>
        </div>
        {wait && (
          <span className={cn("rounded-full px-3 py-1.5 font-mono text-xs ring-1 ring-inset", wait.overdue ? "bg-danger/10 text-danger ring-danger/30" : "text-mist-300 ring-white/12")}>
            Waiting {wait.label}
          </span>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 rounded-2xl bg-ink-950/50 p-4 ring-1 ring-inset ring-white/6">
        <Person label="Reported by" person={context.data?.report.reporter} />
        <Person label={report.contentType === "user" ? "Reported player" : "Author"} person={context.data?.report.author} />
      </div>

      {report.reason && (
        <blockquote className="border-l-2 border-danger/50 pl-4 text-sm leading-relaxed text-mist-200">“{report.reason}”</blockquote>
      )}

      <section aria-label="Reported content" className="grid gap-3">
        <p className="type-label text-[0.6rem] text-mist-500">What was reported</p>
        {context.isLoading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : post ? (
          <div className="rounded-2xl bg-white/3 p-4 ring-1 ring-inset ring-white/8">
            <p className="flex items-center gap-2.5 text-sm">
              <Avatar src={post.authorImage || undefined} name={post.authorName} size="sm" />
              <span className="font-semibold">{post.authorName}</span>
              <span className="font-mono text-xs text-mist-500">{formatDateTime(post.createdAt)}</span>
            </p>
            <RichText content={post.content} className="mt-3" />
            {post.media.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-thin">
                {post.media.slice(0, 4).map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                    <img src={url} alt="" className="h-24 w-auto object-cover" />
                  </a>
                ))}
              </div>
            )}
            <p className="mt-3 font-mono text-xs text-mist-500">
              {post.likeCount} likes · {post.commentCount} comments
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/3 p-4 text-sm text-mist-100 ring-1 ring-inset ring-white/8">
            {report.entity?.content ? <RichText content={report.entity.content} /> : <p className="leading-relaxed">{reportedSummary(report)}</p>}
            {report.contentType !== "post" && report.contentType !== "comment" && report.entity && (
              <Link
                to={`/${report.contentType === "user" ? "users" : report.contentType === "team" ? "teams" : "hubs"}/${report.contentId}`}
                className="type-label mt-3 inline-flex items-center gap-1.5 text-lavender-300 hover:text-lavender-200"
              >
                Open dossier
              </Link>
            )}
          </div>
        )}
        {report.contentType === "post" && (
          <ButtonLink href={playerAppLink(`/post/${report.contentId}`)} external tone="outline" size="xs" icon="open" className="w-fit">
            View on Gamerie
          </ButtonLink>
        )}
      </section>

      {(history.data?.length ?? 0) > 1 && (
        <section className="grid gap-2">
          <p className="type-label text-[0.6rem] text-mist-500">History</p>
          <ol className="grid gap-2 text-sm">
            {history.data!.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 text-mist-300">
                <span className="font-mono text-xs text-mist-500">{formatDateTime(entry.createdAt)}</span>
                <span>{entry.action === "created" ? "Reported" : entry.action === "deleted" ? "Deleted" : `Marked ${statusLabel(entry.nextStatus)}`}</span>
                {entry.metadata?.moderatorNotes && <span className="text-mist-400">“{entry.metadata.moderatorNotes}”</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {pending ? (
        <section className="grid gap-4 border-t border-white/6 pt-6">
          <TextAreaField
            id="report-note"
            label="Note (on the audit log)"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What you found and what you did about it"
          />
          {decision.isError && <Notice tone="danger">{getApiErrorMessage(decision.error, "That didn't save. Try again.")}</Notice>}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button tone="ghost" size="sm" disabled={!ready} onClick={() => decide("dismissed")}>
              Dismiss
            </Button>
            <Button tone="outline" size="sm" icon="check" disabled={!ready} onClick={() => decide("resolved")}>
              Resolve
            </Button>
            {removable && (
              <Button size="sm" icon="trash" disabled={!ready} onClick={() => decide("resolved", true)}>
                Remove {meta.label.toLowerCase()}
              </Button>
            )}
          </div>
        </section>
      ) : (
        report.moderatorNotes && <p className="border-t border-white/6 pt-5 text-sm text-mist-300">Decision note: “{report.moderatorNotes}”</p>
      )}
    </article>
  );
}
