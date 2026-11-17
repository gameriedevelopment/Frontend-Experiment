import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { TokenMark } from "@/components/ui/TokenMark";
import { publicLinks } from "@/config/links";
import { getApiErrorMessage } from "@/lib/errors";
import { PlayerCard } from "./components/PlayerCard";
import { usePublicPlayerCard } from "./hooks";
import { buildPlayerCardModel } from "./playerCard";

type ActionState = "idle" | "working" | "done" | "error";

async function copyText(value: string) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Clipboard access is unavailable.");
}

function updateMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(element);
  }
  element.content = content;
}

const provenance = [
  ["Competitive statistics", "Recorded by Gamerie"],
  ["Player title and listed skills", "Player provided"],
  ["Skill endorsements", "Community recorded"],
];

function Frame({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-svh overflow-hidden bg-ink-950 px-gutter py-6 text-mist-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_30%_35%,rgb(198_163_255/0.12),transparent)]"
      />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between">
        <a href={publicLinks.website} aria-label="Gamerie website" className="flex items-center gap-2.5">
          <TokenMark className="h-6 text-lavender-400" />
          <span className="type-display text-[1.05rem] tracking-[0.04em]">Gamerie</span>
        </a>
        <Link to="/login" className="text-sm font-medium text-mist-300 hover:text-mist-50">
          Sign in
        </Link>
      </header>
      <div className="relative mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

export function PlayerCardPage() {
  const { username } = useParams();
  const query = usePublicPlayerCard(username);
  const [copyState, setCopyState] = useState<ActionState>("idle");
  const [downloadState, setDownloadState] = useState<ActionState>("idle");
  const model = useMemo(() => (query.data?.shareable ? buildPlayerCardModel(query.data) : null), [query.data]);
  const shareUrl = `${window.location.origin}/s/${encodeURIComponent(username || "")}`;

  useEffect(() => {
    if (!model) return;
    const title = `${model.username} — Gamerie player card`;
    const description = `${model.title}${model.game ? ` · ${model.game.name}` : ""}. View this player identity on Gamerie.`;
    document.title = title;
    updateMeta("description", description);
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:url", shareUrl, true);
    updateMeta("og:type", "profile", true);
  }, [model, shareUrl]);

  const copyLink = async () => {
    setCopyState("working");
    try {
      await copyText(shareUrl);
      setCopyState("done");
      window.setTimeout(() => setCopyState("idle"), 2400);
    } catch {
      setCopyState("error");
    }
  };

  const download = async () => {
    if (!model) return;
    setDownloadState("working");
    try {
      // Loaded on demand; most visitors never save the image.
      const { renderPlayerCardPng } = await import("./renderPlayerCardPng");
      const blob = await renderPlayerCardPng(model);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${model.username.replace(/[^a-z0-9_-]+/gi, "-")}-gamerie-card.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setDownloadState("done");
      window.setTimeout(() => setDownloadState("idle"), 2400);
    } catch {
      setDownloadState("error");
    }
  };

  const share = async () => {
    if (!model) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${model.username}'s Gamerie player card`,
          text: `${model.title}${model.game ? ` · ${model.game.name}` : ""}`,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  };

  if (query.isLoading)
    return (
      <Frame>
        <div role="status" aria-label="Loading player card" className="grid gap-10 pt-16 lg:grid-cols-2">
          <Skeleton className="mx-auto h-136 w-full max-w-96 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      </Frame>
    );

  if (query.isError || !query.data)
    return (
      <Frame>
        <StatePanel
          className="mx-auto mt-24 max-w-lg"
          icon="warning"
          tone="danger"
          title="Player card unavailable"
          description={getApiErrorMessage(query.error, "This player card may not exist, or Gamerie couldn't load it right now.")}
          action={
            <Button tone="outline" size="sm" icon="refresh" onClick={() => void query.refetch()}>
              Try again
            </Button>
          }
        />
      </Frame>
    );

  if (!query.data.shareable || !model)
    return (
      <Frame>
        <StatePanel
          className="mx-auto mt-24 max-w-lg"
          icon="lock"
          title="This card isn't public"
          description="This player has limited their profile visibility, so their card can't be shared."
          action={
            <LinkButton to="/login" tone="outline" size="sm">
              Open Gamerie
            </LinkButton>
          }
        />
      </Frame>
    );

  return (
    <Frame>
      <div className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20 lg:py-20">
        <PlayerCard model={model} tilt className="mx-auto w-full max-w-96" />
        <div className="max-w-md">
          <p className="type-display text-display-md">
            <span className="block">{model.username}'s</span>
            <span className="block text-lavender-400">player card.</span>
          </p>
          <p className="mt-5 text-lead text-mist-300">
            Built from Gamerie records. It shows where every detail comes from, and never invents a statistic.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" icon={copyState === "done" ? "check" : "copy"} onClick={() => void copyLink()}>
              {copyState === "done" ? "Link copied" : "Copy link"}
            </Button>
            <Button tone="outline" size="lg" icon="share" onClick={() => void share()}>
              Share
            </Button>
            <Button tone="outline" size="lg" icon={downloadState === "done" ? "check" : "image"} disabled={downloadState === "working"} onClick={() => void download()}>
              {downloadState === "working" ? "Drawing…" : downloadState === "done" ? "Saved" : "Save image"}
            </Button>
          </div>
          {downloadState === "error" && (
            <p role="alert" className="mt-3 text-sm text-danger">
              The image couldn't be made. Try again, or take a screenshot of the card.
            </p>
          )}
          {copyState === "error" && (
            <p role="alert" className="mt-3 text-sm text-danger">
              The link couldn't be copied. Copy it from your browser's address bar instead.
            </p>
          )}
          <dl className="mt-10 grid gap-3 border-t border-white/8 pt-6 text-sm">
            {provenance.map(([label, source]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-mist-400">{label}</dt>
                <dd className="font-medium">{source}</dd>
              </div>
            ))}
          </dl>
          <Link
            to={`/profile/${model.username}`}
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-lavender-300 hover:text-lavender-200"
          >
            Open full profile
            <Icon name="arrowRight" className="size-4" />
          </Link>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {copyState === "done" ? "Player card link copied." : ""}
      </p>
    </Frame>
  );
}
