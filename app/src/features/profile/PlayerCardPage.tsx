import { m } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, LinkButton } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatePanel } from "@/components/ui/StatePanel";
import { TokenMark } from "@/components/ui/TokenMark";
import { publicLinks } from "@/config/links";
import { useAuthStore } from "@/features/auth/authStore";
import { cn } from "@/lib/cn";
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

const provenance: Array<{ icon: IconName; label: string; source: string }> = [
  { icon: "trophy", label: "Stats and levels", source: "Recorded on Gamerie" },
  { icon: "user", label: "Title and skills", source: "Added by the player" },
  { icon: "endorse", label: "Endorsements", source: "Given by other players" },
];

const rise = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function Frame({ children }: { children: ReactNode }) {
  const signedIn = useAuthStore((state) => Boolean(state.user));
  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-ink-950 px-gutter py-6 text-mist-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_38%_at_50%_22%,rgb(198_163_255/0.16),transparent_70%)] lg:bg-[radial-gradient(42%_55%_at_27%_45%,rgb(198_163_255/0.17),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="halftone pointer-events-none absolute inset-0 -z-10 text-white/[0.05] [mask-image:radial-gradient(70%_32%_at_50%_22%,black,transparent)] lg:[mask-image:radial-gradient(38%_52%_at_27%_45%,black,transparent)]"
      />
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <a href={publicLinks.website} aria-label="Gamerie website" className="flex items-center gap-2.5">
          <TokenMark className="h-6 text-lavender-400" />
          <span className="type-display text-[1.05rem] tracking-[0.04em]">Gamerie</span>
        </a>
        {signedIn ? (
          <Link to="/home" className="inline-flex items-center gap-1.5 text-sm font-medium text-mist-300 hover:text-mist-50">
            Open Gamerie
            <Icon name="arrowRight" className="size-4" />
          </Link>
        ) : (
          <nav aria-label="Account" className="flex items-center gap-5">
            <Link to="/login" className="text-sm font-medium text-mist-300 hover:text-mist-50">
              Sign in
            </Link>
            <LinkButton to="/register" size="sm">
              Join Gamerie
            </LinkButton>
          </nav>
        )}
      </header>
      <div className="mx-auto max-w-6xl">{children}</div>
    </main>
  );
}

export function PlayerCardPage() {
  const { username } = useParams();
  const query = usePublicPlayerCard(username);
  const viewer = useAuthStore((state) => state.user);
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
        <div role="status" aria-label="Loading player card" className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20 lg:py-20">
          <Skeleton className="mx-auto h-144 w-full max-w-[25rem] rounded-card" />
          <div className="grid max-w-lg gap-5">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-28 rounded-tile" />
            <Skeleton className="h-12 w-3/4 rounded-full" />
          </div>
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

  const own = viewer?.username?.toLowerCase() === model.username.toLowerCase();
  const profilePath = `/profile/${encodeURIComponent(model.username)}`;
  const copyButton = (
    <Button tone={own ? "lavender" : "outline"} icon={copyState === "done" ? "check" : "copy"} onClick={() => void copyLink()} className={cn(own && "col-span-2")}>
      {copyState === "done" ? "Link copied" : "Copy link"}
    </Button>
  );

  return (
    <Frame>
      <div className="grid items-center gap-12 py-10 lg:grid-cols-2 lg:gap-20 lg:py-20">
        <m.div {...rise} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="relative mx-auto w-full max-w-[25rem]">
          <div aria-hidden="true" className="absolute inset-x-6 -bottom-6 -z-10 h-24 rounded-full bg-lavender-500/25 blur-3xl" />
          <PlayerCard model={model} tilt />
        </m.div>

        <m.div {...rise} transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }} className="max-w-lg max-lg:mx-auto max-lg:w-full max-lg:max-w-[25rem]">
          <p className="type-label flex items-center gap-2 text-lavender-300">
            <Icon name="identity" weight="duotone" className="size-4" />
            Gamerie player card
          </p>
          <h1 className="type-display mt-5 text-display-md">
            <span className="block break-words">{own ? "Your" : `${model.username}'s`}</span>
            <span className="block text-lavender-400">player card.</span>
          </h1>
          <p className="mt-5 text-lead text-mist-300">
            {own
              ? "Share it anywhere. The link always shows your latest Gamerie record."
              : `Built from what ${model.username} has recorded on Gamerie, with every detail labeled by where it comes from.`}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            {own ? (
              <>
                {copyButton}
                <Button tone="outline" icon="share" onClick={() => void share()}>
                  Share
                </Button>
                <Button tone="outline" icon={downloadState === "done" ? "check" : "image"} disabled={downloadState === "working"} onClick={() => void download()}>
                  {downloadState === "working" ? "Drawing…" : downloadState === "done" ? "Saved" : "Save image"}
                </Button>
              </>
            ) : (
              <>
                <LinkButton to={profilePath} icon="arrowRight" className="col-span-2">
                  View profile
                </LinkButton>
                {copyButton}
                <Button tone="outline" icon="share" onClick={() => void share()}>
                  Share
                </Button>
              </>
            )}
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

          <section aria-labelledby="card-sources" className="mt-10 border-t border-white/8 pt-6">
            <h2 id="card-sources" className="type-label text-mist-500">
              Where each detail comes from
            </h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {provenance.map((item) => (
                <li key={item.label} className="flex items-center gap-3 sm:flex-col sm:items-start">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/5 text-lavender-300 ring-1 ring-inset ring-white/8">
                    <Icon name={item.icon} weight="duotone" className="size-[1.1rem]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-sm text-mist-400">{item.source}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {own ? (
            <Link
              to="/settings?section=profile"
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-lavender-300 hover:text-lavender-200"
            >
              Edit what your card shows
              <Icon name="arrowRight" className="size-4" />
            </Link>
          ) : (
            !viewer && (
              <Link
                to="/register"
                className="group mt-8 flex items-center gap-4 rounded-tile bg-white/[0.04] p-4 ring-1 ring-inset ring-white/8 transition-colors hover:bg-white/[0.07]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lavender-400 text-ink-950">
                  <TokenMark className="h-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">Get your own player card</span>
                  <span className="mt-0.5 block text-sm text-mist-400">Join Gamerie and start building your record.</span>
                </span>
                <Icon name="arrowRight" className="size-4 shrink-0 text-mist-300 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          )}
        </m.div>
      </div>
      <p className="sr-only" aria-live="polite">
        {copyState === "done" ? "Player card link copied." : ""}
      </p>
    </Frame>
  );
}
